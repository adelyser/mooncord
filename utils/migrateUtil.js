const path = require('path')
const fs = require('fs')
const logSymbols = require('log-symbols');

module.exports = {}
module.exports.init = async () => {
    await migrateDatabase()
    migrateConfig()
}
function migrateConfig() {
    const config = require('../config.json')
    if (typeof (config.prefix) !== 'undefined') {
        console.log(logSymbols.info, `Migrate 0.0.1 Config to 0.0.2 Config`.database)
        console.log(logSymbols.warning, `Please Read the Update Notes, you need to reconfigure the Bot!`.database)
        config.prefix = undefined
        config.botapplicationkey = ""
        config.botapplicationid = ""
        saveData(config, '../config.json')
        process.exit(5)
    }
}
async function migrateDatabase() {
    const firstDatabasePath = path.resolve(__dirname, '../discorddatabase.json')
    try {
        if (fs.existsSync(firstDatabasePath)) {
            console.log(logSymbols.info, `Migrate 0.0.1 Database to 0.0.2 Database`.database)
        }
        const firstDatabase = require('../discorddatabase.json')

        const newDatabase = {
            "version": "0.0.2",
            "guilds": firstDatabase
        }

        const stringNewDatabase = JSON.stringify(newDatabase)
            .replace(/("accessrole":\[\],)/g,'')
            .replace(/("accessusers":\[\],)/g,'')
            .replace(/("accesseveryone":)/g,'')
            .replace(/(true)/g,'')
            .replace(/(false)/g,'')
            .replace(/("statuschannels":)/g, 'broadcastchannels')
        
        saveData(JSON.parse(stringNewDatabase), '../database.json')

        await fs.unlink(firstDatabasePath)
    } catch(err) {
        console.error((err).err)
    }
}

function saveData(datadata, datapath) {
  fs.writeFile(path.resolve(__dirname, datapath), JSON.stringify(datadata), (err) => {
    if (err) { throw err }
    console.log(logSymbols.info, 'The Data has been migrated!'.database)
  })
}