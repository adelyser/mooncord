const Discord = require("discord.js")
const logSymbols = require("log-symbols")
const fs = require("fs").promises
const fetch = require("node-fetch")
const path = require("path")
const axios = require("axios")
const sharp = require("sharp")

const args = process.argv.slice(2)

const moonrakerClient = require("../clients/moonrakerClient")

const config = require(`${args[0]}/mooncord.json`)

async function retrieveWebcam() {
  const { webcam } = config
  const {
    brightness,
    contrast,
    greyscale,
    horizontal_mirror,
    quality,
    rotation,
    sepia,
    vertical_mirror,
  } = webcam

  const beforeStatus = config.status.before
  const afterStatus = config.status.after

  await executePostProcess(beforeStatus)

  try {
    // @ts-ignore
    const res = await fetch(webcam.url)
    const buffer = await res.buffer()

    // Only run Jimp if they want the image modifed
    if (
      brightness ||
      contrast ||
      greyscale ||
      horizontal_mirror ||
      rotation ||
      sepia ||
      vertical_mirror
    ) {
      const image = await sharp(buffer)

      image
        .rotate(rotation)
        .flip(vertical_mirror)
        .flop(horizontal_mirror)
        .greyscale(greyscale)

      if(brightness) {
        image.modulate({ 
          brightness: (brightness + 1)
        })
      }

      if(contrast) {
        image.linear(contrast + 1, -(128 * (contrast + 1)) + 128)
      } 

      if (sepia) {
        image.recomb([
         [0.3588, 0.7044, 0.1368],
         [0.299, 0.587, 0.114],
         [0.2392, 0.4696, 0.0912],
        ])
      }

      image.png({
        quality
      })

      const editBuffer = await image.toBuffer()

      await executePostProcess(afterStatus)

      return new Discord.MessageAttachment(editBuffer, "snapshot.png")
    }

    // Else just send the normal images
    await executePostProcess(afterStatus)

    return new Discord.MessageAttachment(buffer, "snapshot.png")
  } catch (error) {
    if (error) {
      console.log(logSymbols.error, `Webcam Util: ${error}`)

      return new Discord.MessageAttachment(
        await fs.readFile(
          path.resolve(__dirname, "../images/snapshot-error.png")
        ),
        "snapshot-error.png"
      )
    }
  }
}

async function executePostProcess(config) {
  if (!config.enable || config.execute.length === 0) {
    return
  }

  await sleep(config.delay)

  let index = 0

  while (index < config.execute.length) {
    const execute = config.execute[index]
    if (execute.startsWith("gcode:")) {
      const gcode = execute.replace("gcode:", "")
      const id = Math.floor(Math.random() * Number.parseInt("10_000")) + 1
      moonrakerClient
        .getConnection()
        .send(
          `{"jsonrpc": "2.0", "method": "printer.gcode.script", "params": {"script": "${gcode}"}, "id": ${id}}`
        )
    }
    if (execute.startsWith("website_post:")) {
      const url = execute.replace("website_post:", "")
      triggerWebsite(url, true)
    }
    if (execute.startsWith("website:")) {
      const url = execute.replace("website:", "")
      triggerWebsite(url, false)
    }
    await sleep(config.delay)
    index++
  }

  await sleep(config.delay)
}

async function triggerWebsite(url, post) {
  if (post) {
    await axios.post(url)
    return
  }
  await axios.get(url)
}

async function sleep(delay) {
  return await new Promise((r) => setTimeout(r, delay))
}

module.exports.retrieveWebcam = function () {
  return retrieveWebcam()
}
