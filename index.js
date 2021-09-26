const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger')
//const userClass = require('./userClass')

//const token = 

const bot = new TelegramBot (token, {polling: true});

const directory = "./users.json";

var fs = require ("fs");
const { isUndefined } = require('util');
const { set, random } = require('lodash');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');

var users = {}
loadUsers()

const messageOptions = { //Required after every message that needs to mention the user in case they don't have a username
    parse_mode: 'MarkdownV2'
}

function loadUsers(){ //copies the list of cookiejars into a dictioary
    fs.readFile(directory, 'utf8', (err, data) => {
        if (err) {
            logger.errorLog(err)
            return
        }
        //console.log(data);
        users = JSON.parse(data)
    })
}

function writeUsers(){ //Copies users and cookie jars into the file
    fs.writeFile(directory, JSON.stringify(users, null, 4), {flag:'w+'}, err => { //null serve a rimpiazzare il replacer che serve da filtro, 4 da un tab e \n per rendere il json leggibile
        if (err) {
            logger.errorLog(err) //Added an error log in case the file breaks somehow
            return
        }
    })
}

function updateUser(id, username, firstName, lastName){
    users[id]['username'] = username
    users[id]['firstName'] = firstName
    users[id]['lastName'] = lastName
}

function userExists(userID){ //Checks if the user is already present in the users json file
    loadUsers()
    for (let [user, other] of Object.entries(users)) { //goes through the dictionary and returns a touple with user, cookie amount pairs
        if (user === String(userID)) { //when it finds the corresponding id returns true
            return true
        }
    }
    return false
}
//Renamed to getMention for clarity
function getMention(user){ 
    if (user.username != undefined || users[user.id]['username'] != undefined){
        let ret = (user.username != undefined) ? user['username'].replace("_", "\\_") : users[user.id]['username'].replace("_", "\\_") //Ternary operator
        return '@' + ret
    }
    else return (user.first_name != undefined) ? '[' + user.first_name + '](tg://user?id=' + String(user.id) + ')' : '[' + users[user.id]['firstName'] + '](tg://user?id=' + String(user.id) + ')' //If they don't have a username it returns a MarkdownV2 link that acts as a mention of the user based on id, also another ternary
}

function modcookie(user, amount, casistic) { //adds an amount of cookies in the username's cookiejar
    loadUsers()
    users[String(user.id)]['cookies'] += amount
    if (users[String(user.id)]['cookies'] < 0) users[String(user.id)]['cookies'] = 0
    updateUser(user.id, user.username, user.first_name, user.last_name)
    writeUsers()
    logger.modLog(user, amount, casistic)
}

function giveCookies(chatId, giver, reciever, amount){ //Used to exchange cookies between 2 users
    loadUsers()
    users[String(giver.id)]['cookies'] -= amount
    users[String(reciever.id)]['cookies'] += amount
    updateUser(giver.id, giver.username, giver.first_name, giver.last_name)
    writeUsers()
    bot.sendMessage(chatId, getMention(giver) +" gave "+ amount +"🍪 to "+ getMention(reciever), messageOptions) //This is what a message looks like with the new check for usernames, the @ is given in checkUsername
    logger.giveLog(giver, reciever, amount)
}

function get_random_id() {
    loadUsers()
    var random = Math.floor(Math.random() * Object.entries(users).length)
    var index = 0
    for (let [user, other] of Object.entries(users)) 
    {
        if (random == index) {
            var ret = user
        }
        index++
    }
    return ret
}

bot.onText(/\/cookiejar/, (msg) =>{
    const chatId = msg.chat.id;
    const user = msg.from; //takes the entire user class
    var isPresent = false;
    loadUsers()
    updateUser(user.id,user.username,user.first_name,user.last_name)
    //console.log(user); //prints the list on console, for debug purposes
    if (userExists(user.id)) { //when it finds the corresponding nickname sends the cookies you have
        bot.sendMessage(chatId,getMention(user)+"'s cookiejar:\n"+users[String(user.id)]['cookies']+"🍪",messageOptions)
    }
    else { //if the user is a new user, creates a new cookiejar with 10 cookies in it
        users[String(user.id)] = {
            'id': String(user.id),
            'username': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'cookies': 10
        }
        writeUsers()
        bot.sendMessage(chatId,getMention(user)+"'s cookiejar:\n"+10+"🍪",messageOptions)
    }
});

bot.onText(/\/cookiemenu/, (msg) => {
    bot.sendMessage(msg.chat.id, "🍪 here's your cookie menu 🍪\n🍯cookiejar:\n see how many 🍪 you have in your cookiejar or if you don't have one, it creates one\n✋🏻give:\n 1. /give (your message needs to be a reply)\n 2\\. /give <amount> (needs to be a reply)\n 3\\. /give @username <amount>\n alternatively, you can reply with \"🍪\" and it will act as a normal /give, therefore needs to be a reply\n🎮games:\n open the games menu\n🏆leaderboard:\n see the top cookiejars!", {
    "reply_markup": {
        "keyboard": [["/cookiejar"] , ["/give"], ["/games"], ["/leaderboard"]]
        }
    });
    });


bot.onText(/\/give (.+)/, (msg, match) => { //   /give @username <amount> (does not need to be a reply to work)
    const chatId = msg.chat.id;
    const giver = msg.from; //takes the chatid and the nickname
    loadUsers()
    const rec = match[1] //takes the string you wrote (format "@user <amount>")
    var name_amount = rec.split(" ");
    var name_amount = name_amount.filter(function(x){ //Remove empty list entries
        return x !== ''
    })
    var reciver = null
    for (let [user, other] of Object.entries(users)) 
    {
        if (("@"+users[user]['username']) == name_amount[0]) {
            reciver = user;
        }
    }
    const reciv = users[reciver]
    if (reciver != null) { //treat as /give @ n
        if (userExists(giver.id) && userExists(reciv.id)) {
        // ^found the reciver and giver jars
            updateUser(giver.id, giver.username, giver.first_name, giver.last_name)
            updateUser(reciv.id, reciv.username, reciv.firstName, reciv.lastName)
            const amount = parseInt(name_amount[1]); //converts whatever's after the @user
            if (isNaN(amount)) amount = 1; //Invalid numbers are set to 1
            if ((users[String(giver.id)]['cookies'] - amount) < 0) { //calculates your cookies after you give them away (how could you?!?)
                bot.sendMessage(chatId, "sorry, you don't have enough cookies to give "+ amount + "🍪 :(\n" + getMention(giver) + "'s cookiejar:\n"+ users[String(giver.id)]['cookies'] +"🍪",messageOptions);
            }
            else{
                giveCookies(chatId, giver, reciv, amount)
            }
        }
        else bot.sendMessage(chatId, "you or the reciever don't have a cookiejar");
    }
    else if(!(msg.reply_to_message == undefined)){ //this fucking statement costed me like half an hour cuz if you don't check this shit bot just gives a polling error
        const reciver = msg.reply_to_message.from //takes the user of the replied message
        var amount = parseInt(match[1]); //converts the string in integer
        if (isNaN(amount)) amount = 1;
        if (userExists(giver.id) && userExists(reciver.id)){
            updateUser(giver.id, giver.username, giver.first_name, giver.last_name)
            updateUser(reciver.id, reciver.username, reciver.first_name, reciver.last_name)
            if ((users[String(giver.id)]['cookies'] - amount) < 0) {
                bot.sendMessage(chatId, "sorry, you don't have enough cookies to give "+ amount + "🍪 :(\n" + getMention(giver) + "'s cookiejar:\n"+ users[giver.id]['cookies'] +"🍪",messageOptions);
            }
            else{
                giveCookies(chatId, giver, reciver, amount)
            }
        }
        else bot.sendMessage(chatId, "you or the reciever don't have a cookiejar");
    }//none of the ifs corresponds = "/give" used incorrectly, print the instructions
    else bot.sendMessage(chatId,"how to use the /give command:\n1. /give (your message needs to be a reply)\n2. /give <amount> (needs to be a reply)\n3. /give @username <amount>");
});

// TODO (maybe) : implement the format "give name <amount>"

bot.onText(/\/give/, (msg) => { // just /give (needs to be a reply to work) gives 1 cookie without specifying the amount
    if (msg.text === '/give') //This should work
    {
        const chatId = msg.chat.id;
        const giver = msg.from; //takes the chatid and the nickname
        if(msg.reply_to_message == undefined) //prevents the polling error from ealrier in case the message isn't a reply
        bot.sendMessage(chatId,"how to use the /give command:\n1. /give (your message needs to be a reply)\n2. /give <amount> (needs to be a reply)\n3. /give @username <amount>\nalternatively, you can reply with \"🍪\" and it will act as a normal /give, therefore needs to be a reply");
        else{
            const reciver = msg.reply_to_message.from
            if (userExists(giver.id) && userExists(reciver.id)){
                updateUser(giver.id, giver.username, giver.first_name, giver.last_name)
                updateUser(reciver.id, reciver.username, reciver.first_name, reciver.last_name)
                if ((users[String(giver.id)]['cookies'] - amount) < 0) {
                    bot.sendMessage(chatId, "sorry, you don't have enough cookies to give "+ amount + "🍪 :(\n" + getMention(giver) + "'s cookiejar:\n"+ users[giver.id]['cookies'] +"🍪",messageOptions);
                }
                else giveCookies(chatId, giver, reciver, amount)
            }
            else bot.sendMessage(chatId, "you or the reciever don't have a cookiejar");
        }
    }
});
//Changed until here
bot.onText(/🍪/, (msg) => { // just 🍪 (needs to be a reply to work) gives 1 cookie without specifying the amount
    if (msg.text === '🍪')
    {
        const chatId = msg.chat.id;
        const giver = msg.from; //takes the chatid and the nickname
        if(msg.reply_to_message == undefined) //prevents the polling error from ealrier in case the message isn't a reply
        bot.reply_to_message(chatId,"how to use the /give command:\n1. /give (your message needs to be a reply)\n2. /give <amount> (needs to be a reply)\n3. /give @username <amount>\nalternatively, you can reply with \"🍪\" and it will act as a normal /give, therefore needs to be a reply");
        else{
            const reciver = msg.reply_to_message.from
            if (userExists(giver.id) && userExists(reciver.id)){
                updateUser(giver.id, giver.username, giver.first_name, giver.last_name)
                updateUser(reciver.id, reciver.username, reciver.first_name, reciver.last_name)
                if ((users[String(giver.id)]['cookies'] - amount) < 0) {
                    bot.sendMessage(chatId, "sorry, you don't have enough cookies to give "+ amount + "🍪 :(\n" + getMention(giver) + "'s cookiejar:\n"+ users[giver.id]['cookies'] +"🍪",messageOptions);
                }
                else giveCookies(chatId, giver, reciver, amount)
            }
            else bot.sendMessage(chatId, "you or the reciever don't have a cookiejar");
        }
    }
});

bot.onText(/\/games/, (msg) => {
    bot.sendMessage(msg.chat.id, "🕹 games menu! 🎮\n🍀chance:\n something will happen, you may gain 🍪 👀\n🍐cookiefruit:\n pick one of the fruits below\n 🍎🍐🍊🍋🍌🍉🍪\n and put it next to the command like this\n /cookiefruit 🍐\n and pray RNGesus you get it right to win some cookies\\! \n playing fee is 1🍪\n you can win between 3 and 10🍪.\n🎰cookieslot:\n /cookieslot <amount>\n bet what you want\\! \n gain up to 8 times your bet\n (max you can gain is a x7 multiplier, min is x1.5)\n the price for playing is the amount you bet\n🍀good luck!🍀", {
        "reply_markup": {
            "keyboard": [["/cookiechance"] , ["/cookiefruit"],["/cookieslot"], ["/cookiemenu"]]
            }
        });
});

bot.onText(/\/cookiefruit/, (msg) => {

    if(msg.text === '/cookiefruit')
    bot.sendMessage(msg.chat.id,"🍐cookiefruit game instructions🍊\npick one of the fruits below\n🍎🍐🍊🍋🍌🍉🍪\nand put it next to the command like this\n/cookiefruit 🍐\nand pray RNGesus you get it right to win some cookies!\nplaying fee is 1🍪\nyou can win between 3 and 10🍪.\n 🍀good luck!🍀", {
        "reply_markup": {
            "keyboard": [["/cookiefruit 🍎","/cookiefruit 🍐"],["/cookiefruit 🍊","/cookiefruit 🍋"],["/cookiefruit 🍌","/cookiefruit 🍉"],["/cookiefruit 🍪","/games"]]
            }
        });
});

bot.onText(/\/cookiefruit (.+)/,(msg, match) =>{
    const fruit = String(match[1])
    const chatid = msg.chat.id
    const user = msg.from
    const prize = Math.floor(Math.random() * 8) + 3
    const papere = "🍎🍐🍊🍋🍌🍉🍪"
    var winner
    if(!(fruit === undefined)){
        if (userExists(user.id)){ //Added this check before every minigame so if you try to play it without a cookiejar it tells you to make one
            updateUser(user.id, user.username, user.first_name, user.last_name)
            //modcookie(user,-1,"/cookiefruit fee")
            const waah = Math.floor(Math.random() * 7)
            switch (waah){
                case 0:
                    winner ="🍎"
                    break;
                case 1:
                    winner ="🍐"
                    break;
                case 2:
                    winner ="🍊"
                    break;
                case 3:
                    winner ="🍋"
                    break;
                case 4:
                    winner ="🍌"
                    break;
                case 5:
                    winner ="🍉"
                    break;
                case 6:
                    winner ="🍪"
                    break;
                default:
                    break;
            }
            if(papere.includes(fruit)){
                //.then method used to fix the order of the messages, explained in leaderboard function
                bot.sendMessage(chatid," rolled "+ winner +" for "+getMention(user)+"'s game\nfruit bet: "+ fruit , messageOptions).then(() => {
                    if (fruit === winner) {
                        bot.sendMessage(chatid, "congratulations\n"+ getMention(user) +" won "+ prize +"🍪",messageOptions)
                        //modcookie(user,prize,"/cookiefruit win")
                    }
                    else{
                        bot.sendMessage(chatid,"better luck next time "+ getMention(user)+" ☹️\n",messageOptions)
                    }
                })
                
            }
        }
        else bot.sendMessage(chatid,'you need a cookiejar to play games, type /cookiejar to make one')
    }
});

bot.onText(/\/cookieslot/, (msg) => {
    if(msg.text === '/cookieslot')
    bot.sendMessage(msg.chat.id,"🎰cookieslot game instructions🍀\n /cookieslot <amount>\nbet what you want!\n gain up to 8 times your bet\n(max you can gain is a x7 multiplier, min is x1.5)\nthe price for playing is the amount you bet\n 🍀good luck!🍀");
});

bot.onText(/\/cookieslot (.+)/, (msg,match) =>{
    const user = msg.from
    const chatid = msg.chat.id
    if (userExists(user.id)){
        updateUser(user.id, user.username, user.first_name, user.last_name)
        var bet = parseInt(match[1])
        if (isNaN(bet)) bet = 1
        modcookie(user,-bet,"/cookieslot fee")
        var one,two,three
        switch (Math.floor(Math.random() * 4)){
            case 0:
                one ="🍎"
                break;
            case 1:
                one ="🍐"
                break;
            case 2:
                one ="🍌"
                break;
            case 3:
                one ="🍪"
                break;
            default:
                one ="🍪"
                break;
        }
        switch (Math.floor(Math.random() * 4)){
            case 0:
                two ="🍎"
                break;
            case 1:
                two ="🍐"
                break;
            case 2:
                two ="🍌"
                break;
            case 3:
                two ="🍪"
                break;
            default:
                two ="🍪"
                break;
        }
        switch (Math.floor(Math.random() * 4)){
            case 0:
                three ="🍎"
                break;
            case 1:
                three ="🍐"
                break;
            case 2:
                three ="🍌"
                break;
            case 3:
                three ="🍪"
                break;
            default:
                three ="🍪"
                break;
        }
        bot.sendMessage(chatid, getMention(user)+"'s roll results:\n"+one+two+three,messageOptions)
        var roll = one+two+three
        var won = false
        if(roll.lastIndexOf("🍎") != roll.indexOf("🍎")){
            if(roll.includes("🍎🍎🍎")) bet = bet*2
            else bet = bet*1.5
            won = true
        }
        if(roll.lastIndexOf("🍐") != roll.indexOf("🍐")){
            if(roll.includes("🍐🍐🍐")) bet = bet*4
            else bet = bet*1.5
            won = true
        }
        if(roll.lastIndexOf("🍌") != roll.indexOf("🍌")){
            if(roll.includes("🍌🍌🍌")) bet = bet*6
            else bet = bet*1.5
            won = true
        }
        if(roll.lastIndexOf("🍪") != roll.indexOf("🍪")){
            if(roll.includes("🍪🍪🍪")) bet = bet*8
            else bet = bet*2
            won = true
        }
        bet= Math.floor(bet)
        if (won){
            bot.sendMessage(chatid,"you won\n"+bet+"🍪 added to "+getMention(user)+" cookiejar",messageOptions)
            modcookie(user,bet,"/cookieslot win")
        }
        else bot.sendMessage(chatid,"better luck next time "+getMention(user)+" :^)")
    }
    else bot.sendMessage(chatid,'you need a cookiejar to play games, type /cookiejar to make one',messageOptions)
});

bot.onText(/\/cookiechance/, (msg) =>{
    const user = msg.from
    const chatid = msg.chat.id
    const luizo = users[271081666]
    var recc = 271081666
    if (userExists(user.id)){
        updateUser(user.id, user.username, user.first_name, user.last_name)
        const luck = Math.floor(Math.random() * 100)
        switch (luck) {
            case 0:
                bot.sendMessage(chatid,"you plant a cookie into the ground, it sprouts in a magnificent cookie tree\\! \n"+getMention(user)+" gains 10🍪 from the harvest\\! ",messageOptions)
                modcookie(user,10,"/cookiechance outcome "+luck)
                break;
            case 1:
                bot.sendMessage(chatid,"since he worked so hard on this bot,\n@LuigiBrosNin gains a 🍪 :D")
                modcookie(luizo, 1,"/cookiechance outcome "+luck)
                break;
            case 2:
                bot.sendMessage(chatid,"your grandma comes to visit you\\.\n"+getMention(user)+" gains 1🍪 and a kiss from grandma",messageOptions)
                modcookie(user, 1,"/cookiechance outcome "+luck)
                break;
            case 3:
                bot.sendMessage(chatid,"you organize a DnD session so everyone would bring a snack\\.\n it worked\\.\n"+getMention(user)+" gains 4🍪 and the master's handbook",messageOptions)
                modcookie(user, 4,"/cookiechance outcome "+luck)
                break;
            case 4:
                bot.sendMessage(chatid,"your local bakery got an overflow of cookies\\. they give ou some to balance out the issue\\.\n"+getMention(user)+" gains 3🍪",messageOptions)
                modcookie(user, 3,"/cookiechance outcome "+luck)
                break;
            case 5:
                bot.sendMessage(chatid,"you spent all your savings on the cookie sale at the supermarket\\. it was a wise choice\\.\n"+getMention(user)+" gains 5🍪 from the sale",messageOptions)
                modcookie(user, 5,"/cookiechance outcome "+luck)
                break;
            case 6:
                bot.sendMessage(chatid,"you learn how to summon cookies with satanic rituals\\.\n"+getMention(user)+" gains 6🍪 and a succubus that can bake cookies",messageOptions)
                modcookie(user, 6,"/cookiechance outcome "+luck)
                break;
            case 7:
                bot.sendMessage(chatid,"lady luck smiled to you\\. you didn't win the lottery, but you found some cookies\\.\n"+getMention(user)+" gains 7🍪 and some good luck",messageOptions)
                modcookie(user, 7,"/cookiechance outcome "+luck)
                break;
            case 8:
                bot.sendMessage(chatid,"life gave you lemons, so you sold them and bought more cookies\\.\n"+getMention(user)+" gains 8🍪 and a lemonade stand",messageOptions)
                modcookie(user, 8,"/cookiechance outcome "+luck)
                break;
            case 9:
                bot.sendMessage(chatid,"you found a cup of water from the long lost fountain of youth\\. you use that water as ingredient for the cookies you were baking\n"+getMention(user)+" gains 9🍪 and feels a lil older",messageOptions)
                modcookie(user, 9,"/cookiechance outcome "+luck)
                break;
            case 10:
                bot.sendMessage(chatid,"you posted a meme everyone enjoyed\\.\n"+getMention(user)+" gains 3🍪 and the developer of this bot's approval",messageOptions)
                modcookie(user, 3,"/cookiechance outcome "+luck)
                break;
            case 11:
                bot.sendMessage(chatid,"you hacked into this bot and generated yourself some cookies\\.\n"+getMention(user)+" gains 9🍪 and you'd better hope admins don't catch you",messageOptions)
                modcookie(user, 9,"/cookiechance outcome "+luck)
                break;
            case 12:
                bot.sendMessage(chatid,"you make your way through Hogwarts just to learn how to spawn cookies\\.\n"+getMention(user)+" gains 4🍪 and a magic wand",messageOptions)
                modcookie(user, 4,"/cookiechance outcome "+luck)
                break;
            case 13:
                bot.sendMessage(chatid,"You offer to the shrine, but gain nothing\\.\nYou offer to the shrine, but gain nothing\\.\nYou offer to the shrine, but gain nothing\\.\nYou offer to the shrine, but gain nothing\\.\nYou offer to the shrine, but gain nothing\\.\nYou offer to the shrine, but gain nothing\\.\nYou offer to the shrine, but gain nothing\\.\nYou offer to the shrine, but gain nothing\\.\nin the end you say \"fuck it\" and open a random chest next to the shrine\\. it had some cookies\\.\n"+getMention(user)+" gains 2🍪 and a gambling addiction",messageOptions)
                modcookie(user, 2,"/cookiechance outcome "+luck)
                break;
            case 14:
                bot.sendMessage(chatid,"your life is so miserable, they assign you fairy godparents\\. you wish the only thing worth wishing\\.\n"+getMention(user)+" gains 1🍪, but you don't keep the fairies\\.\ni'm sorry\\.",messageOptions)
                modcookie(user, 1,"/cookiechance outcome "+luck)
                break;
            case 15:
                bot.sendMessage(chatid,"this message has only 1% chance to pop up and you were so lucky\\.\n"+getMention(user)+" gains 1🍪 and now knows a secret\\.\n that secret is how many prompts the developer wrote for this stupid game",messageOptions)
                modcookie(user, 1,"/cookiechance outcome "+luck)
                break;
            case 16:
                bot.sendMessage(chatid,"you unistalled league of legends\\.\n"+getMention(user)+" gains 3🍪 and your soul back",messageOptions)
                modcookie(user, 3,"/cookiechance outcome "+luck)
                break;
            case 17:
                bot.sendMessage(chatid,"you finally pass the logic exam\\.\n"+getMention(user)+" gains 999🍪 and 9 CFU\\.\n\\(just kidding, you only gain 5\\. i'm sorry\\)",messageOptions)
                modcookie(user, 5,"/cookiechance outcome "+luck)
                break;
            case 18:
                bot.sendMessage(chatid,"you start a notion, gaining everyone's trust and respect\\.\n"+getMention(user)+" gains 8🍪",messageOptions)
                modcookie(user, 8,"/cookiechance outcome "+luck)
                break;
            case 19:
                bot.sendMessage(chatid,"you discover that cookie clicker exists\\.\n"+getMention(user)+" gains 1🍪 and addiction to the game",messageOptions)
                modcookie(user, 1,"/cookiechance outcome "+luck)
                break;
            case 20:
                bot.sendMessage(chatid,"you start working in a cookie mine as cookiedigger, it pays off\\.\n"+getMention(user)+" gains 4🍪 and Klondike nostalgia",messageOptions)
                modcookie(user, 4,"/cookiechance outcome "+luck)
                break;
            case 21:
                bot.sendMessage(chatid,"you open up a factory to produce cookies\\. it bankrupts the next day, but  you keep all production\\.\n"+getMention(user)+" gains 6🍪",messageOptions)
                modcookie(user, 6,"/cookiechance outcome "+luck)
                break;
            case 22:
                bot.sendMessage(chatid,"you invest some cookies in the cookie stock market\\. it pays off\\.\n"+getMention(user)+" gains 3🍪 and rising stonks",messageOptions)
                modcookie(user, 3,"/cookiechance outcome "+luck)
                break;
            case 23:
                bot.sendMessage(chatid,"you build a temple to honor the cookie god\\. there's no such thing as a cookie god, but you keep the offerings\\.\n"+getMention(user)+" gains 4🍪 and a mitre hat with a cookie on it\\.",messageOptions)
                modcookie(user, 4,"/cookiechance outcome "+luck)
                break;
            case 24:
                bot.sendMessage(chatid,"you become CEO of tesla and nasa to explore the universe searching for the legendary cookie planet\\. banks give full funding on the prject\\.\n"+getMention(user)+" gains 7🍪 \\(and a meme lord\\)",messageOptions)
                modcookie(user, 7,"/cookiechance outcome "+luck)
                break;
            case 25:
                bot.sendMessage(chatid,"you find the philosopher's cookie, that turns gold into cookies\\. yay\\!\n"+getMention(user)+" gains 6🍪, but your mom can't find her wedding ring",messageOptions)
                modcookie(user, 6,"/cookiechance outcome "+luck)
                break;
            case 26:
                bot.sendMessage(chatid,"you manage to open up a portal to the cookieverse\\. you manage to grab some cookies before the portal exploded\\.\n"+getMention(user)+" gains 2🍪 and an invasion of cookie monsters",messageOptions)
                modcookie(user, 2,"/cookiechance outcome "+luck)
                break;
            case 27:
                bot.sendMessage(chatid,"you discover time travel to bring here cookies before they were eaten\\.\n"+getMention(user)+" gains 5🍪 and a time paradox",messageOptions)
                modcookie(user, 5,"/cookiechance outcome "+luck)
                break;
            case 28:
                bot.sendMessage(chatid,"you gain control of animatter, so you convert it into cookies\\.\n"+getMention(user)+" gains 4🍪",messageOptions)
                modcookie(user, 4,"/cookiechance outcome "+luck)
                break;
            case 29:
                bot.sendMessage(chatid,"you manage to convert light itself into cookies\\. the universe is now pitch black, but you've gained some cookies\\. it's just hard to find them in the dark\n"+getMention(user)+" gains 9🍪",messageOptions)
                modcookie(user, 9,"/cookiechance outcome "+luck)
                break;
            case 30:
                bot.sendMessage(chatid,"you learn clonation is a thing, so you spend billions into cloning some cookies\\.\n"+getMention(user)+" gains 2🍪 and a crippling debt",messageOptions)
                modcookie(user, 2,"/cookiechance outcome "+luck)
                break;
            case 31:
                bot.sendMessage(chatid,"you find a cookie on the ground\\. you better sanitize it before putting it in your cookiejar\\.\n"+getMention(user)+" gains 1🍪 and some soap",messageOptions)
                modcookie(user, 1,"/cookiechance outcome "+luck)
                break;
            case 32:
                bot.sendMessage(chatid,"you buy a fortune cookie, and inside it instead of an advice there's another cookie\\!\n"+getMention(user)+" gains 2🍪 and possible future bad choices",messageOptions)
                modcookie(user, 2,"/cookiechance outcome "+luck)
                break;
            case 33:
                bot.sendMessage(chatid,"a stranger offers you a cookie\\. you accept despite mom's warnings\\.\n"+getMention(user)+" gains 1🍪 and a drug addiction",messageOptions)
                modcookie(user, 1,"/cookiechance outcome "+luck)
                break;
            case 34:
                bot.sendMessage(chatid,"you ask santa Claus for cookies\\. you learn he isn't real, but you can keep the cookies you left for him\\.\n"+getMention(user)+" gains 3🍪 and a cup of milk",messageOptions)
                modcookie(user, 3,"/cookiechance outcome "+luck)
                break;
            case 35:
                bot.sendMessage(chatid,"you learn how to actually bake cookies\\.\n"+getMention(user)+" gains 5🍪 and a new skill",messageOptions)
                modcookie(user, 5,"/cookiechance outcome "+luck)
                break;
            case 36:
                bot.sendMessage(chatid,"Are you a good boy? Yes, you areee 😙\nwhat a good puppy you are\\!\\! Sit\\!\nBravoo you deserve a nice cookie lil' doggy\\!\n"+getMention(user)+" gains 5🍪 cuz he's a good boy🐶",messageOptions)
                modcookie(user, 5,"/cookiechance outcome "+luck)
                break;
            case 37:
                bot.sendMessage(chatid,"you look like someone whose break was scammed away\\.\n"+getMention(user)+" gains 2🍪 cuz i feel your pain\\.\\.\\.",messageOptions)
                modcookie(user, 2,"/cookiechance outcome "+luck)
                break;
            case 38:
                bot.sendMessage(chatid,"your last instagram post where you flex your bum is doing very well\\.\n"+getMention(user)+" gains 3🍪 and a irl stalker",messageOptions)
                modcookie(user, 3,"/cookiechance outcome "+luck)
                break;
            case 39:
                bot.sendMessage(chatid,"you drank your daily 1,5L of water\\. good job\\.\n"+getMention(user)+" gains 4🍪\\. Stay hydrated",messageOptions)
                modcookie(user, 4,"/cookiechance outcome "+luck)
                break;
            case 40:
                bot.sendMessage(chatid,"while you were taking your cookiejar out for a walk, you trip, letting some cookies fly away\\.\n"+getMention(user)+" loses 2🍪",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 41:
                bot.sendMessage(chatid,"a zombie invades your house, eating your cookies\\. another one eats your cousin's brain, but who cares\\.\n"+getMention(user)+" loses 3🍪 and a cousin",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 42:
                bot.sendMessage(chatid,"you ask santa Claus for cookies\\.\nhe saw your internet history\\.\n"+getMention(user)+" loses 1🍪 but you learn to use incognito",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 43:
                bot.sendMessage(chatid,"you die\\. there's nothing after death, just endless darkness\\. someone steals some cookies from you\\. you come back to life knowing you cookies are in danger, but it's too late\\.\nwelp, at least you're alive\\.\n"+getMention(user)+" loses 2🍪 but gains depression",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 44:
                bot.sendMessage(chatid,"the succubus you summoned demands payment\\.\n"+getMention(user)+" loses 2🍪 and your soul is now tied to hell",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 45:
                bot.sendMessage(chatid,"since he worked so hard for this bot, you decide to give the developer a cookie to show your appreciation\\.\n"+getMention(user)+" loses 1🍪 but gains a personal thanks from the dev",messageOptions)
                giveCookies(chatid,user,luizo,1)
                break;
            case 46:
                bot.sendMessage(chatid,"you're a simp\\. you donate some of your cookies to a twitch thot\\.\n"+getMention(user)+" loses 5🍪 and your dignity\\.",messageOptions)
                modcookie(user, -5,"/cookiechance outcome "+luck)
                break;
            case 47:
                bot.sendMessage(chatid,"the lizard man asks to accept his cookies\\. you do, but he instantly sells all your info along with some of your cookies\\.\n"+getMention(user)+" loses 4🍪 and your privacy, but now you have a facebook account",messageOptions)
                modcookie(user, -4,"/cookiechance outcome "+luck)
                break;
            case 48:
                recc = get_random_id()
                bot.sendMessage(chatid,""+ getMention(users[recc]) + " found a way to hijack your cookiejar and stole a cookie\\!\n"+getMention(user)+" loses 1🍪\nbut "+ getMention(users[recc]) +" gains a 🍪\\!",messageOptions)
                giveCookies(chatid,user,users[recc], 1)
                break;
            case 49:
                recc = get_random_id() 
                bot.sendMessage(chatid,""+ getMention(users[recc]) +" stole a cookie while you were in horny jail\n"+getMention(user)+" loses 1🍪\nbut "+ getMention(users[recc]) +" gains a 🍪\\!",messageOptions)
                giveCookies(chatid,user,users[recc], 1)
                break;
            case 50:
                bot.sendMessage(chatid,"bro, that way pretty cringe ngl\\.\n"+getMention(user)+" loses 3🍪 and the \"memelord\" tag",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 51:
                bot.sendMessage(chatid,"your illegal cookie traffic got caught and the merch got confiscated\\.\n"+getMention(user)+" loses 4🍪 and you'll likely go to jail",messageOptions)
                modcookie(user, -4,"/cookiechance outcome "+luck)
                break;
            case 52:
                bot.sendMessage(chatid,"literally nothing happens\\.\n"+getMention(user)+" loses 1🍪 cuz i'm evil",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 53:
                bot.sendMessage(chatid,"bruh cmon, no more blasphemies\\.\nGod is your friend, your father, your brother\\. Respect pls\\.\n"+getMention(user)+" loses 3🍪 and must enact the act of pain 10 times, by the pope\\!",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 54:
                bot.sendMessage(chatid,"you left the mic unmuted during the break\n"+getMention(user)+" loses 4🍪 but gains an invitation to X factor",messageOptions)
                modcookie(user, -4,"/cookiechance outcome "+luck)
                break;
            case 55:
                bot.sendMessage(chatid,"your personal cookiebaking machine became obsolite, you should change it\\.\n"+getMention(user)+" loses 5🍪 for trying to sell your grandma\\. not cool\\.",messageOptions)
                modcookie(user, -5,"/cookiechance outcome "+luck)
                break;
            case 56:
                bot.sendMessage(chatid,"skidaddle skidoodle your dick is now\\.\\.\\. not a cookie\\.\n"+getMention(user)+" loses 1🍪 and better deal with it",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 57:
                bot.sendMessage(chatid,"you make your way trough and find the true infinite source of cookies\\. you're rich\\. everyone will bow before your cookiejar\\.\ndrin drin\\.\n"+getMention(user)+" loses 3🍪 and snaps back to reality\\.",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 58:
                bot.sendMessage(chatid,"the teacher saw you wearing a hoodie next to some kids punching to death a first\\-year\\. guess who got detention\\.\n"+getMention(user)+" loses 2🍪",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 59:
                bot.sendMessage(chatid,"someone from the future invented time travel and went back in time to steal your cookies\\. huh\\. weird\\.\n"+getMention(user)+" loses 5🍪",messageOptions)
                modcookie(user, -5,"/cookiechance outcome "+luck)
                break;
            case 60:
                bot.sendMessage(chatid,"you plant a cookie into the ground\\. a fox steals it before it grows into a cookie tree\n"+getMention(user)+" loses 1🍪 but now your nose gets longer whenever you tell a lie",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 61:
                bot.sendMessage(chatid,"you lived in a small house, on a hill\\. you baked cookies while your moms watched christian podcast at the television\\. life was simple\\. and you were both happy\\. [\\.\\.\\.]\n"+getMention(user)+" loses 3🍪 and you find yourself in a really weird place\\.\\.\\.",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 62:
                bot.sendMessage(chatid,"you see a cute duck and you can't help it\\.\n"+getMention(user)+" loses 1🍪 to feed the duck",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 63:
                bot.sendMessage(chatid,"you forgot you were baking cookies\\. the oven ran away with the cookies\\.\n"+getMention(user)+" loses 2🍪 and an oven",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 64:
                bot.sendMessage(chatid,"you try to corrupt the cookiebot dev to add cookies on your cookiejar with nuts\\. it works, but the OTHER dev catches you\\.\n"+getMention(user)+" loses 5🍪, but Luizo kept the nuts",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 65:
                bot.sendMessage(chatid,"you are now immortal\\. you also discover cookies can rotten\\. it wasn't a problem when you were mortal\\.\\.\\. but now\\.\\.\\.\n"+getMention(user)+" loses 3🍪, they rotten away",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 66:
                recc = get_random_id() 
                bot.sendMessage(chatid,"/give " + getMention(users[recc]) +" 1\n"+getMention(user)+" loses 1🍪\nbut "+ getMention(users[recc]) +" gains a 🍪\\!\n\\(that's how /give works duh\\)",messageOptions)
                giveCookies(chatid,user,users[recc], 1)
                break;
            case 67:
                bot.sendMessage(chatid,"shrek demands some of your cookies\\. you can't really say no\\.\n"+getMention(user)+" loses 4🍪 but can now stay in the swamp",messageOptions)
                modcookie(user, -4,"/cookiechance outcome "+luck)
                break;
            case 68:
                bot.sendMessage(chatid,"the enemy stand user steals some of your cookies\\.\n"+getMention(user)+" loses 4🍪",messageOptions)
                modcookie(user, -4,"/cookiechance outcome "+luck)
                break;
            case 69:
                bot.sendMessage(chatid,"normally this would be a negative outcome\\.\\.\\. but you rolled the funny number\\.\\.\\. soooo\\.\\.\\.\n"+getMention(user)+" gains 69🍪 \\(just kidding, you only gain 6\\. don't wanna break the economy i'm sorry\\)",messageOptions)
                modcookie(user, 6,"/cookiechance outcome "+luck)
                break;
            case 70:
                recc = get_random_id()
                    bot.sendMessage(chatid,"gain cookies\\!\noh wait, i gave them to the wrong dude\\.\\.\\.\n"+ getMention(users[recc]) +" gains 1🍪 by mistake",messageOptions)
                    modcookie(users[recc], 1,"/cookiechance outcome "+luck)
                break;
            case 71:
                bot.sendMessage(chatid,"you failed NNN this year\\. too bad\\! \n"+getMention(user)+" loses 3🍪 and godly powers",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 72:
                bot.sendMessage(chatid,"Dio B\\. kisses your crush\\. you don't care, but he also ate the cookies she baked for you\\.\n"+getMention(user)+" loses 4🍪",messageOptions)
                modcookie(user, -4,"/cookiechance outcome "+luck)
                break;
            case 73:
                bot.sendMessage(chatid,"Scout decided that a bucket of chicken wasn't enough anymore\\.\n"+getMention(user)+" loses 2🍪",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 74:
                bot.sendMessage(chatid,"you lose in a pokemon battle but you don't have any money\\. pheraps there's something else she wants?\n"+getMention(user)+" loses 1🍪 and a gym medal",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 75:
                bot.sendMessage(chatid,"you make a pentakill in league of legends\\. good job\\.\n"+getMention(user)+" loses 5🍪",messageOptions)
                modcookie(user, -5,"/cookiechance outcome "+luck)
                break;
            case 76:
                bot.sendMessage(chatid,"a velociraptor breaks in your house\\. instead of throwing bananas at you while you study, he eats some cookies\\. what a douch\\.\n"+getMention(user)+" loses 3🍪",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 77:
                bot.sendMessage(chatid,"you look in the sky\\. it's a bird\\! it's a plane\\! no\\.\\.\\. it's the magical cookiestealer!\n"+getMention(user)+" loses 1🍪",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 78:
                recc = get_random_id()
                bot.sendMessage(chatid,"POV: you're in Naples\\.\n "+getMention(users[recc])+" steals from you\\.\n"+getMention(user)+" loses 1🍪\nbut "+getMention(users[recc])+" gains a 🍪\\!\n\\(that's how /give works duh\\)",messageOptions)
                giveCookies(chatid,user,users[recc], 1)
                break;
            case 79:
                bot.sendMessage(chatid,"you forgot the ogre's name from the movie Shrek\\.\n"+getMention(user)+" loses 1🍪 but gains alzheimer",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 80:
                bot.sendMessage(chatid,"you look in the sky\\. it's a bird\\! it's a plane\\! no\\.\\.\\. it's the magical cookiestealer\\!\n"+getMention(user)+" loses 1🍪",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
            case 81:
                bot.sendMessage(chatid,"a headcrab attack your cookiejar\\.\n"+getMention(user)+" loses 2🍪",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 82:
                bot.sendMessage(chatid,"you forgot how stonks work, you give some cookies away for free\n"+getMention(user)+" loses 3🍪 and the economy degree",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 83:
                bot.sendMessage(chatid,"a Wrinkler starts consuming your biggest cookie\\.\n"+getMention(user)+" loses 1🍪",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 84:
                bot.sendMessage(chatid,"a talking flower claims to be your friend\\. he wasn't\\.\n"+getMention(user)+" loses 2🍪",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 85:
                bot.sendMessage(chatid,"4 armed men with clown masks rob your cookiejar\n"+getMention(user)+" loses 4🍪",messageOptions)
                modcookie(user, -4,"/cookiechance outcome "+luck)
                break;
            case 86:
                bot.sendMessage(chatid,"a madman with a shovel fell from the sky and grabbed one of your cookies before blasting away\n"+getMention(user)+" loses 1🍪",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 87:
                bot.sendMessage(chatid,"you manage to diss the CEO of Dissing and flame\\.\n"+getMention(user)+" loses 2🍪 because fuck you",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 88:
                bot.sendMessage(chatid,"you're using this command too much\\.\n\\(nah, this is just random\\. you're still losing cookies tho\\)\n"+getMention(user)+" loses 2🍪",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 89:
                bot.sendMessage(chatid,"thanks to your epic fortnite gamer skills, you manage to stay a virgin forever\n"+getMention(user)+" loses 3🍪 but gain a fit forearm",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 90:
                bot.sendMessage(chatid,"with the power of friendship, you gain cookies\\! \\.\\.\\.but you have no friends\n"+getMention(user)+" loses 5🍪 and gains actual depression",messageOptions)
                modcookie(user, -5,"/cookiechance outcome "+luck)
                break;
            case 91:
                bot.sendMessage(chatid,"you mistakenly think that giraffes exist\n"+getMention(user)+" loses 1🍪, snap back to reality",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 92:
                bot.sendMessage(chatid,"you mistakenly think 3D girls are better than 2D girls\n"+getMention(user)+" loses 3🍪, just like the dimensions you like",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 93:
                bot.sendMessage(chatid,"a masked french weirdo just backstabs you and steals your cookies\n"+getMention(user)+" loses 4🍪, there's a spy creepin' around here\\!",messageOptions)
                modcookie(user, -4,"/cookiechance outcome "+luck)
                break;
            case 94:
                bot.sendMessage(chatid,"you get stuck and call your stepbro to help you out\\. He didn't fuck you, but ate your cookies\\.\n"+getMention(user)+" loses 4🍪 but gains a body to conceal\\. that fucker had to pay for what he has done",messageOptions)
                modcookie(user, -4,"/cookiechance outcome "+luck)
                break;
            case 95:
                bot.sendMessage(chatid,"you live the dream of your life and get isekai'd in a fantasy world with a lot of cute girls who will eventually become your harem\\.\nbut you left the cookiejar at home open\\.\n"+getMention(user)+" loses 3🍪 but gains an harem, altrough\\.\\.\\. they're all lolis so you can't do much anyway",messageOptions)
                modcookie(user, -3,"/cookiechance outcome "+luck)
                break;
            case 96:
                bot.sendMessage(chatid,"/give 9999🍪\nerror: \"nice try\"\\."+getMention(user)+" loses 1🍪 ",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 97:
                bot.sendMessage(chatid,"you didn't donate to the developer's parteon\\.\n"+getMention(user)+" loses 1🍪 \\(it doesn't exist, but i'mma still getting this cookie out your jar\\)",messageOptions)
                modcookie(user, -1,"/cookiechance outcome "+luck)
                break;
            case 98:
                bot.sendMessage(chatid,"waking up, you realize you live in a world without enough cookies\\.\n"+getMention(user)+" loses 2🍪 ",messageOptions)
                modcookie(user, -2,"/cookiechance outcome "+luck)
                break;
            case 99:
                bot.sendMessage(chatid,"yooo this is case 99\\! congrats\\! you win:\n"+getMention(user)+" loses 9🍪",messageOptions)
                modcookie(user, -9,"/cookiechance outcome "+luck)
                break;
            default:
                break;
        }
    }
    else bot.sendMessage(chatid,'you need a cookiejar to play games, type /cookiejar to make one')
});


bot.onText(/\/leaderboard/, (msg) =>{
    loadUsers()
    const chatId = msg.chat.id;
    var array = Object.values(users)
    array.sort(function(a,b) { return b['cookies'] - a['cookies'] } );
    message = '🏆Leaderboard: \n'
    var num = 0
    for (let [user, other] of Object.entries(users)) {
        message = message +(num+1)+"\\) "+ array[num].firstName + " " + array[num].lastName + ": " + array[num].cookies +"🍪\n" 
        num++
        if (num >= 10) break
    }
    message = message.replace("-","\\-")
    message = message.replace("_","\\_")
    message = message.replace("~","\\~")
    message = message.replace("`","\\`")
    message = message.replace(".","\\.")
    message = message.replace("!","\\!")
    bot.sendMessage(chatId, message,messageOptions)
})