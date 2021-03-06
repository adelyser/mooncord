const config = require('../config.json');
const admin = false
const master = true
const discordDatabase = require('../discorddatabase')
const Discord = require('discord.js');
var id = Math.floor(Math.random() * 10000) + 1
var wsConnection
var dcMessage
var requester
var invalidCommands = []
var unknownCommands = []
var executeReaction = (function(message,user,guild,emote,discordClient,websocketConnection){
    requester=user
    dcMessage=message
    wsConnection=websocketConnection
    if(emote.name=="❌"){
        message.channel.send("<@"+user.id+"> You cancel the GCode executions!")
        message.delete()
        return
    }
    if(emote.name=="✅"){
        message.channel.send("<@"+user.id+"> The GCodes will be send to Moonraker!")
        var gcodeCommands = []
        invalidCommands=[]
        unknownCommands=[]
        gcodeCommands=message.embeds[0].description.replace(/(\`)/g,"").split(" ")
        console.log(gcodeCommands)
        //websocketConnection.send('{"jsonrpc": "2.0", "method": "printer.gcode.script", "params": {"script": "'+message.embeds[0].author.name+'"}, "id": '+id+'}')
        //websocketConnection.on('message', handler);
        var gcodeTimer=0
        var gcodePosition=0
        gcodeTimer=setInterval(()=>{
            if(gcodePosition==gcodeCommands.length){
                if(unknownCommands.length!=0||invalidCommands.length!=0){
                    if(unknownCommands.length!=0){
                        var gcodeList = (unknownCommands.length)+" GCode Commands are unknown:\n\n"
                        for(var i = 0; i<=unknownCommands.length-1;i++){
                            gcodeList=gcodeList.concat("`"+unknownCommands[i]+"` ")
                        }
                        const exampleEmbed = new Discord.MessageEmbed()
                        .setColor('#d60000')
                        .setTitle('Unknown GCode Commands')
                        .setDescription(gcodeList)
                        .attachFiles(__dirname+"/../images/execute.png")
                        .setThumbnail(url="attachment://execute.png")
                        .setTimestamp()
                        .setFooter(user.tag, user.avatarURL());
                    
                        message.channel.send(exampleEmbed);
                    }
                    if(invalidCommands.length!=0){
                        var gcodeList = (invalidCommands.length)+" GCode Commands are invalid (with Reason):\n\n"
                        for(var i = 0; i<=invalidCommands.length-1;i++){
                            gcodeList=gcodeList.concat("`"+invalidCommands[i]+"` ")
                        }
                        const exampleEmbed = new Discord.MessageEmbed()
                        .setColor('#d60000')
                        .setTitle('Invalid GCode Commands')
                        .setDescription(gcodeList)
                        .attachFiles(__dirname+"/../images/execute.png")
                        .setThumbnail(url="attachment://execute.png")
                        .setTimestamp()
                        .setFooter(user.tag, user.avatarURL());
                    
                        message.channel.send(exampleEmbed);
                    }
                }else{
                    message.channel.send("<@"+user.id+"> all GCodes Commands executed successfully!")
                }
                clearInterval(gcodeTimer)
                return
            }
            console.log("Execute Command ["+(gcodePosition+1)+"] "+gcodeCommands[gcodePosition])
            websocketConnection.send('{"jsonrpc": "2.0", "method": "printer.gcode.script", "params": {"script": "'+gcodeCommands[gcodePosition]+'"}, "id": '+id+'}')
            websocketConnection.on('message', handler);
            gcodePosition++
        },500);
        message.delete()
        return
    }
})

function handler(message){
    var messageJson = JSON.parse(message.utf8Data)
    if(messageJson.method=="notify_gcode_response"){
        if(messageJson.params[0].includes("Unknown command")){
            var command = messageJson.params[0].replace("// Unknown command:","").replace(/\"/g,"")
            unknownCommands.push(command)
            wsConnection.removeListener('message', handler)
        }
        if(messageJson.params[0].includes("Error")){
            var command = messageJson.params[0].replace("!! Error on ","").replace(/\'/g,"")
            invalidCommands.push(command)
            wsConnection.removeListener('message', handler)
        }
    }
    setTimeout(()=>{
        wsConnection.removeListener('message', handler)
    },1000)

}

module.exports = executeReaction;
module.exports.needAdmin = function(){return admin}
module.exports.needMaster = function(){return master}