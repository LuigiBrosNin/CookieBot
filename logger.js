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

function giveLog(giver, reciver, amount){
    fs.appendFile(loggeroni, "[" + dateAndTime() + "] " + giver.id + " (@" + giver.username + ") gave "+ amount +"🍪 to "+ reciver.id + " (@" + reciver.username + ")")
    cleanFile()
}

function modLog(user, amount, reason){
    fs.appendFile(loggeroni, "[" + dateAndTime() + "] " + user.id + " (@" + giver.username + ") recieved/lost "+ amount +"🍪 from " + reason)
    cleanFile()
}

function errorLog(err){
    fs.appendFile(loggeroni, "[" + dateAndTime() + "] An error has occurred: " + err)
    cleanFile()
}