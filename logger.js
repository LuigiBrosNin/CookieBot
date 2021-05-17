const loggeroni = "./cookie_trans.log";

function dateAndTime(){
    let date = new Date().toLocaleDateString("it-IT")
    let time = new Date().toLocaleTimeString("it-IT")
    return date + ' ' + time
}

function giveLog(giver, reciver, amount){
    fs.appendFile(loggeroni, "[" + dateAndTime() + "] " + giver.id + " (@" + giver.username + ") gave "+ amount +"🍪 to "+ reciver.id + " (@" + reciver.username + ")")
}

function modLog(user, amount, reason){
    fs.appendFile(loggeroni, "[" + dateAndTime() + "] " + user.id + " (@" + giver.username + ") recieved/lost "+ amount +"🍪 from " + reason)
}

