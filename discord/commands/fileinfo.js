const { SlashCommand, CommandOptionType } = require('slash-create')
const logSymbols = require('log-symbols')

const moonrakerClient = require('../../clients/moonrakerclient')
const handlers = require('../../utils/handlerUtil')
const locale = require('../../utils/localeUtil')

const commandlocale = locale.commands.fileinfo

let commandFeedback
let connection

module.exports = class FileInfoCommand extends SlashCommand {
    constructor(creator) {
        console.log(logSymbols.info, 'Load File Info Command')
        super(creator, {
            name: commandlocale.command,
            description: commandlocale.description,
            options: [{
                type: CommandOptionType.STRING,
                name: commandlocale.options.file.name,
                description: commandlocale.options.file.description,
                required: true
            }]
        })
        this.filePath = __filename
    }

    run(ctx) {
        try {
            if (typeof (commandFeedback) !== 'undefined') {
                return locale.errors.not_ready.replace(/(\${username})/g, ctx.user.username)
            }
            let gcodefile = ctx.options.file
            if (!gcodefile.endsWith('.gcode')) {
                gcodefile += '.gcode'
            }

            const id = Math.floor(Math.random() * parseInt('10_000')) + 1
            connection = moonrakerClient.getConnection()

            let timeout = 0

            commandFeedback = undefined

            ctx.defer(false)

            connection.on('message', handler)
            connection.send(`{"jsonrpc": "2.0", "method": "server.files.metadata", "params": {"filename": "${gcodefile}"}, "id": ${id}}`)
            const feedbackInterval = setInterval(() => {
                if (typeof (commandFeedback) !== 'undefined') {
                    if (commandFeedback === 'Not Found!') {
                        commandFeedback = undefined
                        ctx.send({
                            content: locale.errors.file_not_found
                        })
                    } else {
                        if (commandFeedback.files.length > 0) {
                            const thumbnail = commandFeedback.files[0]
                            const files = {
                                name: thumbnail.name,
                                file: thumbnail.attachment
                            }
                            ctx.send({
                                file: files,
                                embeds: [commandFeedback.toJSON()]
                            })
                        } else {
                            ctx.send({
                                embeds: [commandFeedback.toJSON()]
                            })
                        }
                        commandFeedback = undefined
                    }
                    clearInterval(feedbackInterval)
                }
                if (timeout === 4) {
                    ctx.send({
                        content: locale.errors.command_timeout
                    })
                    commandFeedback = undefined
                    clearInterval(feedbackInterval)
                    connection.removeListener('message', handler)
                }
                timeout++
           }, 500)
        }
        catch (error) {
            console.log(logSymbols.error, `Fileinfo Command: ${error}`.error)
            commandFeedback = undefined
            connection.removeListener('message', handler)
            return locale.errors.command_failed
        }
    }
    async onUnload() {
        return 'okay'
    }
}

async function handler (message) {
    commandFeedback = await handlers.printFileHandler(message, locale.fileinfo.title, '#0099ff')
    connection.removeListener('message', handler)
}