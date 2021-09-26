const loggeroni = "./cookie_trans.log";

const fs = require('fs')

function cleanFile(){
    fs.readFile(loggeroni, (err, fileContent) => {
        let list = String(fileContent).split('\n')
        if (list.length > 256){
            list.shift()
            fs.writeFile(loggeroni,list.join('\n'),() => {})
        }
    })
}

function dateAndTime(){
    let date = new Date().toLocaleDateString("it-IT")
    let time = new Date().toLocaleTimeString("it-IT")
    return date + ' ' + time
}

function checkUsername(user){
    if (user.username != null){
        return '@' + user.username
    }
    else{
        if (user.last_name != null) return user.first_name + ' ' + user.last_name
        else return user.first_name
    }
}

function giveLog(giver, reciver, amount){
    fs.appendFile(loggeroni, "[" + dateAndTime() + "] " + giver.id + " ("+ checkUsername(giver) +") gave "+ amount +"🍪 to "+ reciver.id + " (" + checkUsername(reciver) + ")\n",() => {})
    cleanFile()
}

function modLog(user, amount, reason){
    fs.appendFile(loggeroni, "[" + dateAndTime() + "] " + user.id + " (" + checkUsername(user) + ") recieved "+ amount +"🍪 from " + reason + "\n",() => {})
    cleanFile()
}

function errorLog(err){
    fs.appendFile(loggeroni, "[" + dateAndTime() + "] An error has occurred: " + err + "\n", () => {})
    cleanFile()
}

module.exports = {modLog, giveLog, errorLog}