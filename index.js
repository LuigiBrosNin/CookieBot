const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger')

const token = '282811649:AAHrmy3pXmhAUs9vDrvJJLaX2IBKGRF6aiQ';

const bot =new TelegramBot (token, {polling: true});

const directory = "./users.json";// ~/unibot/users.json  <- change the location with the server directory

var fs = require ("fs");
const { isUndefined } = require('util');

var users = {}
loadUsers()

/*
stream.on ("cookiejars", function (cookiejars){ //when the bot starts, reads the list of cookiejars and prints it in the console
    var chunk = cookiejars.String();          // useless but reading test, delete if not wanted
    console.log(chunk);
});
*/

/*
stream = fs.createWriteStream("./cookiejars.txt"); //writing test, scrapped cuz it overrides the file
stream.write("something");
*/

function loadUsers(){ //copies the list of cookiejars into a dictioary
    fs.readFile(directory, 'utf8', (err, data) => {
        if (err) {
            console.error(err)
            return
        }
        users = JSON.parse(data)
    })
}

function writeUsers(){ //Copies users and cookie jars into the file
    fs.writeFile(directory, JSON.stringify(users, null, 4), {flag:'w+'}, err => {}) //null serve a rimpiazzare il replacer che serve da filtro, 4 da un tab e \n per rendere il json leggibile
}

function userExists(userID){
    loadUsers()
    for (let [user, cookies] of Object.entries(users)) { //goes through the dictionary and returns a touple with user, cookie amount pairs
        if (user === String(userID)) { //when it finds the corresponding nickname returns true
            return true
        }
    }
    return false
}

function modcookie(user, amount, casistic) { //adds an amount of cookies in the username's cookiejar
    loadUsers()
    users[String(user.id)] += amount
    if (users[user.id] < 0) users[user.id] = 0
    writeUsers()
    logger.modLog(user, amount, casistic)
}

function giveCookies(chatId, giver, reciever, amount){
    loadUsers()
    users[String(giver.id)] -= amount
    users[String(reciever.id)] += amount
    writeUsers()
    bot.sendMessage(chatId, "@" + giver.username +" gave "+ amount +"🍪 to @"+ reciever.username)
    logger.giveLog(giver, reciever, amount)
}

bot.onText(/\/cookiejar/, (msg) =>{
    const chatId = msg.chat.id;
    const user = msg.from; //takes the entire user class
    var isPresent = false;
    loadUsers()
    console.log(user.username); //prints the list on console, for debug purposes
    if (userExists(user.id)) { //when it finds the corresponding nickname sends the cookies you have
        bot.sendMessage(chatId,"@"+user.username+"'s cookiejar:\n"+users[user.id]+"🍪")
    }
    else { //if the user is a new user, creates a new cookiejar with 10 cookies in it
        users[String(user.id)] = 10
        writeUsers()
        bot.sendMessage(chatId,"@"+user.username+"'s cookiejar:\n"+10+"🍪")
    }
});

bot.onText(/\/cookiemenu/, (msg) => {
    bot.sendMessage(msg.chat.id, "🍪 here's your cookie menu 🍪", {
    "reply_markup": {
        "keyboard": [["/cookiejar"] , ["/give"], ["/games"]]
        }
    });
    });


bot.onText(/\/give (.+)/, (msg, match) => { //   /give @username <amount> (does not need to be a reply to work)
    const chatId = msg.chat.id;
    const giver = msg.from; //takes the chatid and the nickname
    loadUsers()
    const rec = match[1] //takes the string you wrote (format "@user <amount>")
    var name_amount = rec.split(" ");//TODO: Take into account multiple spaces when splitting which result in '' entries
    var name_amount = name_amount.filter(function(x){ //Remove empty list entries
        return x !== ''
    })
    var reciver = null
    console.log(name_amount);
    for (var entity of Object.entries(msg.entities)){
        if (entity.type === 'mention'){
            reciver = entity.user
            break
        }
    }
    if (reciver != null) { //treat as /give @ n
        if (userExists(giver.id) && userExists(reciver.id)) { 
        // ^found the reciver and giver jars
            const amount = parseInt(name_amount[1]); //converts whatever's after the @user
            if (isNaN(amount)) amount = 1;                      // edit: more spaces will result in the program only giving one cookie, fair enough
            if ((users[String(giver.id)] - amount) < 0) { //calculates your cookies after you give them away (how could you?!?)
                bot.sendMessage(chatId, "sorry, you don't have enough cookies to give "+ amount + "🍪 :(\n@" + giver.username + "'s cookiejar:\n"+ users[String(giver.id)] +"🍪");
            }
            else{
                giveCookies(chatId, giver, reciver, amount)
            }
        }
        else bot.sendMessage(chatId, "you or the reciever don't have a cookiejar");
    }
    else if(!(msg.reply_to_message == undefined)){ //this fucking statement costed me like half an hour cuz if you don't check this shit bot just gives a polling error
        const reciver = msg.reply_to_message.from //takes the user of the replied message
        var amount = parseInt(match[1]); //converts the string in integer
        if (isNaN(amount)) amount = 1;
        if (userExists(giver.id) && userExists(reciver.id)){
            if ((users[String(giver.id)] - amount) < 0) {
                bot.sendMessage(chatId, "sorry, you don't have enough cookies to give "+ amount + "🍪 :(\n@" + giver + "'s cookiejar:\n"+ textByLine[i].substr(giver.length+1) +"🍪");
            }
            else{
                giveCookies(chatId, giver, reciver, amount)
            }
        }
        else bot.sendMessage(chatId, "you or the reciever don't have a cookiejar");
    }//none of the ifs corresponds = "/give" used incorrectly, print the instructions
    else bot.sendMessage(chatId,"how to use the /give command:\n1. /give (your message needs to be a reply)\n2. /give <amount> (needs to be a reply)\n3. /give @username <amount>");
});

// TODO (maybe) : implement the format "give name <amount>" this will be tough cuz it needs to check everyone's name in the group and get its @. 
// saving the name along with the @ in the txt is not an option since that would cause many other issues with searching and recognising a cookiejar

// game ideas: choose an emoji, pick a random emoji between a selected type and if it corresponds, give cookies, if not do nothing //done :D
//             pay a set amount of cookies for rolling a slot machine and recive a multiplier reward or lose cookies

bot.onText(/\/give/, (msg) => { // just /give (needs to be a reply to work) gives 1 cookie without specifying the amount
    if (msg.text.endsWith("/give") && msg.text.lastIndexOf("/give") == 0)
    {
        const chatId = msg.chat.id;
        const giver = msg.from; //takes the chatid and the nickname
        if(msg.reply_to_message == undefined) //prevents the polling error from ealrier in case the message isn't a reply
        bot.sendMessage(chatId,"how to use the /give command:\n1. /give (your message needs to be a reply)\n2. /give <amount> (needs to be a reply)\n3. /give @username <amount>");
        else
        giveCookies(chatId, giver, msg.reply_to_message.from, 1)
    }
});

bot.onText(/\/games/, (msg) => {
    bot.sendMessage(msg.chat.id, "🕹 games menu! 🎮\n🍀chance: something will happen, you may gain cookies👀\n ", {
        "reply_markup": {
            "keyboard": [["/cookiechance"] , ["/cookiefruit"],["/cookieslot"], ["/cookiemenu"]]
            }
        });
});

bot.onText(/\/cookiefruit/,(msg) => {
    if(msg.from.text === "/cookiefruit")
    bot.sendMessage(msg.chat.id,"cookiefruit game instructions\npick one of the fruits below\n🍎🍐🍊🍋🍌🍉🍪\nand put it next to the command like this\n/cookiefruit 🍐\nand pray RNGesus you get it right to win some cookies!\nplaying fee is 1🍪.\n good luck!")
});

bot.onText(/\/cookiefruit (.+)/,(msg, match) =>{
    const fruit = String(match[1])
    const chatid = msg.chat.id
    const user = msg.from.username
    const prize = Math.floor(Math.random() * 8) + 3
    var winner
    if (userExists(user.id)){
        modcookie(user,-1,"/cookiefruit fee")
        switch (Math.floor(Math.random() * 7)){
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
                winner ="🍪"
                break;
        }
        if("🍎🍐🍊🍋🍌🍉🍪".contains(fruit)){
            bot.sendMessage(chatid, "rolled "+ winner +" for "+user.username+"'s game\nfruit bet: "+fruit)
            if (fruit === winner) {
                bot.sendMessage(chatid, "congratulations!\n@"+ user.username +" won "+prize+"🍪")
                modcookie(user,prize,"/cookiefruit win")
            }
            else{
                bot.sendMessage(chatid,"better luck next time "+ user.username+" :(\n")
            }
        }
    }
    else bot.sendMessage(chatid,'you need a cookiejar to play games, type /cookiejar to make one')
});

bot.onText(/\/coockieslot (.+)/, (msg,match) =>{
    const user = msg.from
    const chatid = msg.chat.id
    if (userExists(user.id)){
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
        bot.sendMessage(chatid, user.username+"'s roll results:\n"+one+two+three)
        var roll = one+two+three
        var won = false
        if(roll.contains("🍎🍎")){
            if(roll.contains("🍎🍎🍎")) bet = bet*2
            else bet = bet*1.5
            won = true
        }
        if(roll.contains("🍐🍐")){
            if(roll.contains("🍐🍐🍐")) bet = bet*4
            else bet = bet*2
            won = true
        }
        if(roll.contains("🍌🍌")){
            if(roll.contains("🍌🍌🍌")) bet = bet*6
            else bet = bet*2.5
            won = true
        }
        if(roll.contains("🍪🍪")){
            if(roll.contains("🍪🍪🍪")) bet = bet*8
            else bet = bet*3
            won = true
        }
        if (won){
            bot.sendMessage(chatid,"you won!\n"+bet+"🍪 added to @"+user.username+" cookiejar")
            modcookie(user,bet,"/cookieslot win")
        }
        else bot.sendMessage(chatid,"better luck next time @"+user.username+" :^)")
    }
    else bot.sendMessage(chatid,'you need a cookiejar to play games, type /cookiejar to make one')
});

bot.onText(/\/coockiechance/, (msg) =>{
    const user = msg.from
    const chatid = msg.chat.id
    if (userExists(user.id)){
        const luck = Math.floor(Math.random() * 100)
        switch (luck) {
            //TODO cambiare user nei sendmessage con user.username
            case 0:
                bot.sendMessage(chatid,"you plant a cookie into the ground, it sprouts in a magnificent cookie tree!\n@"+user+" gains 10🍪 from the harvest!")
                modcookie(user,10,"/coockiechance outcome "+luck)
                break;
            case 1:
                bot.sendMessage(chatid,"since he worked so hard on this bot,\n@LuigiBrosNin gains a 🍪 :D")
                modcookie("LuigiBrosNin", 1,"/coockiechance outcome "+luck)
                break;
            case 2:
                bot.sendMessage(chatid,"your grandma comes to visit you.\n@"+user+" gains 1🍪 and a kiss from grandma")
                modcookie(user, 1,"/coockiechance outcome "+luck)
                break;
            case 3:
                bot.sendMessage(chatid,"you organize a DnD session so everyone would bring a snack.\n it worked.\n@"+user+" gains 4🍪 and the master's handbook")
                modcookie(user, 4,"/coockiechance outcome "+luck)
                break;
            case 4:
                bot.sendMessage(chatid,"your local bakery got an overflow of cookies. they give ou some to balance out the issue.\n@"+user+" gains 3🍪")
                modcookie(user, 3,"/coockiechance outcome "+luck)
                break;
            case 5:
                bot.sendMessage(chatid,"you spent all your savings on the cookie sale at the supermarket. it was a wise choice.\n@"+user+" gains 5🍪 from the sale")
                modcookie(user, 5,"/coockiechance outcome "+luck)
                break;
            case 6:
                bot.sendMessage(chatid,"you learn how to summon cookies with satanic rituals.\n@"+user+" gains 6🍪 and a succubus that can bake cookies")
                modcookie(user, 6,"/coockiechance outcome "+luck)
                break;
            case 7:
                bot.sendMessage(chatid,"lady luck smiled to you. you didn't win the lottery, but you found some cookies.\n@"+user+" gains 7🍪 and some good luck")
                modcookie(user, 7,"/coockiechance outcome "+luck)
                break;
            case 8:
                bot.sendMessage(chatid,"life gave you lemons, so you sold them and bought more cookies.\n@"+user+" gains 8🍪 and a lemonade stand")
                modcookie(user, 8,"/coockiechance outcome "+luck)
                break;
            case 9:
                bot.sendMessage(chatid,"you found a cup of water from the long lost fountain of youth. you use that water as ingredient for the cookies you were backing\n@"+user+" gains 9🍪 and feels a lil older")
                modcookie(user, 9,"/coockiechance outcome "+luck)
                break;
            case 10:
                bot.sendMessage(chatid,"you posted a meme everyone enjoyed.\n@"+user+" gains 3🍪 and the developer of this bot's approval")
                modcookie(user, 3,"/coockiechance outcome "+luck)
                break;
            case 11:
                bot.sendMessage(chatid,"you hacked into this bot and generated yourself some cookies.\n@"+user+" gains 9🍪 and you'd better hope admins don't catch you")
                modcookie(user, 9,"/coockiechance outcome "+luck)
                break;
            case 12:
                bot.sendMessage(chatid,"you make your way through Hogwarts just to learn how to spawn cookies.\n@"+user+" gains 4🍪 and a magic wand")
                modcookie(user, 4,"/coockiechance outcome "+luck)
                break;
            case 13:
                bot.sendMessage(chatid,"You offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nin the end you say \"fuck it\" and open a random chest next to the shrine. it had some cookies.\n@"+user+" gains 2🍪 and a gambling addiction")
                modcookie(user, 2,"/coockiechance outcome "+luck)
                break;
            case 14:
                bot.sendMessage(chatid,"your life is so miserable, they assign you fairy godparents. you wish the only thing worth wishing.\n@"+user+" gains 1🍪, but you don't keep the fairies.\ni'm sorry.")
                modcookie(user, 1,"/coockiechance outcome "+luck)
                break;
            case 15:
                bot.sendMessage(chatid,"this message has only 1% chance to pop up and you were so lucky.\n@"+user+" gains 1🍪 and now knows a secret.\n that secret is how many prompts the developer wrote for this stupid game")
                modcookie(user, 1,"/coockiechance outcome "+luck)
                break;
            case 16:
                bot.sendMessage(chatid,"you unistalled league of legends.\n@"+user+" gains 3🍪 and your soul back")
                modcookie(user, 3,"/coockiechance outcome "+luck)
                break;
            case 17:
                bot.sendMessage(chatid,"you finally pass the logic exam.\n@"+user+" gains 999🍪 and 9 CFU.\n(just kidding, you only gain 5. i'm sorry)")
                modcookie(user, 5,"/coockiechance outcome "+luck)
                break;
            case 18:
                bot.sendMessage(chatid,"you start a notion, gaining everyone's trust and respect.\n@"+user+" gains 8🍪")
                modcookie(user, 8,"/coockiechance outcome "+luck)
                break;
            case 19:
                bot.sendMessage(chatid,"you discover that cookie clicker exists.\n@"+user+" gains 1🍪 and addiction to the game")
                modcookie(user, 1,"/coockiechance outcome "+luck)
                break;
            case 20:
                bot.sendMessage(chatid,"you start working in a cookie mine as cookiedigger, it pays off.\n@"+user+" gains 4🍪 and Klondike nostalgia")
                modcookie(user, 4,"/coockiechance outcome "+luck)
                break;
            case 21:
                bot.sendMessage(chatid,"you open up a factory to produce cookies. it bankrupts the next day, but  you keep all production.\n@"+user+" gains 6🍪")
                modcookie(user, 6,"/coockiechance outcome "+luck)
                break;
            case 22:
                bot.sendMessage(chatid,"you invest some cookies in the cookie stock market. it pays off.\n@"+user+" gains 3🍪 and rising stonks")
                modcookie(user, 3,"/coockiechance outcome "+luck)
                break;
            case 23:
                bot.sendMessage(chatid,"you build a temple to honor the cookie god. there's no such thing as a cookie god, but you keep the offerings.\n@"+user+" gains 4🍪 and a mitre hat with a cookie on it.")
                modcookie(user, 4,"/coockiechance outcome "+luck)
                break;
            case 24:
                bot.sendMessage(chatid,"you become CEO of tesla and nasa to explore the universe searching for the legendary cookie planet. banks give full funding on the prject.\n@"+user+" gains 7🍪 (and a meme lord)")
                modcookie(user, 7,"/coockiechance outcome "+luck)
                break;
            case 25:
                bot.sendMessage(chatid,"you find the philosopher's cookie, that turns gold into cookies. yay!\n@"+user+" gains 6🍪, but your mom can't find her wedding ring")
                modcookie(user, 6,"/coockiechance outcome "+luck)
                break;
            case 26:
                bot.sendMessage(chatid,"you manage to open up a portal to the cookieverse. you manage to grab some cookies before the portal exploded.\n@"+user+" gains 2🍪 and an invasion of cookie monsters")
                modcookie(user, 2,"/coockiechance outcome "+luck)
                break;
            case 27:
                bot.sendMessage(chatid,"you discover time traver to bring here cookies before they were eaten.\n@"+user+" gains 5🍪 and a time paradox")
                modcookie(user, 5,"/coockiechance outcome "+luck)
                break;
            case 28:
                bot.sendMessage(chatid,"you gain control of animatter, so you convert it into cookies.\n@"+user+" gains 4🍪")
                modcookie(user, 4,"/coockiechance outcome "+luck)
                break;
            case 29:
                bot.sendMessage(chatid,"you manage to convert light itself into cookies. the universe is now pitch black, but you've gained some cookies. it's just hard to find them in the dark\n@"+user+" gains 9🍪")
                modcookie(user, 9,"/coockiechance outcome "+luck)
                break;
            case 30:
                bot.sendMessage(chatid,"you learn clonation is a thing, so you spend billions into cloning some cookies.\n@"+user+" gains 2🍪 and a crippling debt")
                modcookie(user, 2,"/coockiechance outcome "+luck)
                break;
            case 31:
                bot.sendMessage(chatid,"you find a cookie on the ground. you better sanitize it before putting it in your cookiejar.\n@"+user+" gains 1🍪 and some soap")
                modcookie(user, 1,"/coockiechance outcome "+luck)
                break;
            case 32:
                bot.sendMessage(chatid,"you buy a fortune cookie, and inside it instead of an advice there's another cookie!\n@"+user+" gains 2🍪 and possible future bad choices")
                modcookie(user, 2,"/coockiechance outcome "+luck)
                break;
            case 33:
                bot.sendMessage(chatid,"a stranger offers you a cookie. you accept despite mom's warnings.\n@"+user+" gains 1🍪 and a drug addiction")
                modcookie(user, 1,"/coockiechance outcome "+luck)
                break;
            case 34:
                bot.sendMessage(chatid,"you ask santa Claus for cookies. you learn he isn't real, but you can keep the cookies you left for him.\n@"+user+" gains 3🍪 and a cup of milk")
                modcookie(user, 3,"/coockiechance outcome "+luck)
                break;
            case 35:// gap i left cuz i'm waiting for some other possibly good commands from alice
                bot.sendMessage(chatid,"you learn how to actually bake cookies.\n@"+user+" gains 5🍪 and a new skill")
                modcookie(user, 5,"/coockiechance outcome "+luck)
                break;
            case 40:
                bot.sendMessage(chatid,"while you were taking your cookiejar out for a walk, you trip, letting some cookies fly away.\n@"+user+" loses 2🍪")
                modcookie(user, -2,"/coockiechance outcome "+luck)
                break;
            case 41:
                bot.sendMessage(chatid,"a zombie invades your house, eating your cookies. another one eats your cousin's brain, but who cares.\n@"+user+" loses 3🍪 and a cousin")
                modcookie(user, -3,"/coockiechance outcome "+luck)
                break;
            case 42:
                bot.sendMessage(chatid,"you ask santa Claus for cookies.\nhe saw your internet history.\n@"+user+" loses 1🍪 but you learn to use incognito")
                modcookie(user, -1,"/coockiechance outcome "+luck)
                break;
            case 43:
                bot.sendMessage(chatid,"you die. there's nothing after death, just endless darkness. someone steals some cookies from you. you come back to life knowing you cookies are in danger, but it's too late.\nwelp, at least you're alive.\n@"+user+" loses 2🍪 but gains depression")
                modcookie(user, -2,"/coockiechance outcome "+luck)
                break;
            case 44:
                bot.sendMessage(chatid,"the succubus you summoned demands payment.\n@"+user+" loses 2🍪 and your soul is now tied to hell")
                modcookie(user, -2,"/coockiechance outcome "+luck)
                break;
            case 45:
                bot.sendMessage(chatid,"since he worked so hard for this bot, you decide to give the developer a cookie to show your appreciation.\n@"+user+" loses 1🍪 but gains a personal thanks from the dev")
                giveCookies(chatid,user,"LuigiBrosNin",1)
                break;
            case 46:
                bot.sendMessage(chatid,"you're a simp. you donate some of your cookies to a twitch thot.\n@"+user+" loses 5🍪 and your dignity.")
                modcookie(user, -5,"/coockiechance outcome "+luck)
                break;
            case 47:
                bot.sendMessage(chatid,"the lizard man asks to accept his cookies. you do, but he instantly sells all your info along with some of your cookies.\n@"+user+" loses 4🍪 and your privacy, but now you have a facebook account")
                modcookie(user, -4,"/coockiechance outcome "+luck)
                break;
            case 48:
                var index = Math.floor(Math.random() * users.length)
                bot.sendMessage(chatid,"@"+Object.keys(users)[index]+" found a way to hijack your cookiejar and stole a cookie!\n@"+user+" loses 1🍪\nbut @"+Object.keys(users)[index]+" gains a 🍪!")
                giveCookies(chatid,user,Object.keys(users)[index], 1)
                break;
            case 49:
                var index = Math.floor(Math.random() * users.length)
                bot.sendMessage(chatid,"@"+Object.keys(users)[index]+" stole a cookie while you were in horny jail\n@"+user+" loses 1🍪\nbut @"+Object.keys(users)[index]+" gains a 🍪!")
                giveCookies(chatid,user,Object.keys(users)[index], 1)
                break;
            case 50:
                bot.sendMessage(chatid,"bro, that way pretty cringe ngl.\n@"+user+" loses 3🍪 and the \"memelord\" tag")
                modcookie(user, -3,"/coockiechance outcome "+luck)
                break;
            case 51:
                bot.sendMessage(chatid,"your illegal cookie traffic got caught and the merch got confiscated.\n@"+user+" loses 4🍪 and you'll likely go to jail")
                modcookie(user, -4,"/coockiechance outcome "+luck)
                break;
            case 52:
                bot.sendMessage(chatid,"literally nothing happens.\n@"+user+" loses 1🍪 cuz i'm evil")
                modcookie(user, -1,"/coockiechance outcome "+luck)
                break;
            case 53: //keep going from here.
                bot.sendMessage(chatid,"\n@"+user+" loses 1🍪 cuz i'm evil")
                modcookie(user, -1,"/coockiechance outcome "+luck)
                break;
            default:
                break;
        }
    }
    else bot.sendMessage(chatid,'you need a cookiejar to play games, type /cookiejar to make one')
});