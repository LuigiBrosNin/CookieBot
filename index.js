const TelegramBot = require('node-telegram-bot-api');

const token = '282811649:AAHrmy3pXmhAUs9vDrvJJLaX2IBKGRF6aiQ';

const bot =new TelegramBot (token, {polling: true});

const directory = "./users.json";// ~/unibot/users.json  <- change the location with the server directory

const loggeroni = "./cookie_trans.log";

var fs = require ("fs");
const { isUndefined } = require('util');

var users = {}
loadUsers()

/*
stream.on ("cookiejars", function (cookiejars){ //when the bot starts, reads the list of cookiejars and prints it in the console
    var chunk = cookiejars.toString();          // useless but reading test, delete if not wanted
    console.log(chunk);
});
*/

/*
stream = fs.createWriteStream("./cookiejars.txt"); //writing test, scrapped cuz it overrides the file
stream.write("something");
*/

function loadUsers(){ //copies the list of cookiejars into a dictioary
    users = JSON.parse(fs.readFile(directory,{encoding:'utf-8'}))
}

function writeUsers(){ //Copies users and cookie jars into the file
    fs.writeFile(directory, JSON.stringify(users), {mode:'w+'})
}

function modcookie(username, amount, casistic) { //adds an amount of cookies in the username's cookiejar
    users[username] += amount
    if (users[username] < 0) users[username] = 0
    writeUsers()
    fs.appendFile(loggeroni, "@"+username+" gained "+amount+"🍪 with "+casistic)
}

function giveCookies(chatId, giver, reciever, amount){
    users[giver] -= amount
    users[reciever] += amount
    writeUsers()
    bot.sendMessage(chatId, "@" + giver +" gave "+ amount +"🍪 to @"+ reciever)
    fs.appendFile(loggeroni, "@" + giver +" gave "+ amount +"🍪 to @"+ reciever)
}

bot.onText(/\/cookiejar/, (msg) =>{
    const chatId = msg.chat.id;
    const nicc = msg.from.username; //takes the chatid and the nickname
    console.log(users); //prints the list on console, for debug purposes
    var isPresent = false;
    for (let [user, cookies] of Object.entries(users)) { //goes through the dictionary and returns a touple with user, cookie amount pairs
        if (user === nicc) { //when it finds the corresponding nickname sends the cookies you have
            isPresent=true;
            bot.sendMessage(chatId,"@"+user+"'s cookiejar:\n"+cookies+"🍪")
        }
    }
    if (!isPresent) { //if the user is a new user, creates a new cookiejar with 10 cookies in it
        users[nicc] = 10
        writeUsers()
        bot.sendMessage(chatId,"@"+nicc+"'s cookiejar:\n"+10+"🍪")
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
    const nicc = msg.from.username; //takes the chatid and the nickname
    const rec = match[1] //takes the string you wrote (format "@user <amount>")
    var name_amount = rec.split(" ");//TODO: Take into account multiple spaces when splitting which result in '' entries
    var name_amount = name_amount.filter(function(x){ //Remove empty list entries
        return x !== ''
    })
    console.log(name_amount);
    var isPresent = false;
    if (name_amount[0].startsWith("@")) { //treat as /give @ n
        for (let [reciever, cookies] of Object.entries(users)) { //goes through the array to find the reciver
            if (reciever === name_amount[0].substring(1)) { //name_amount[0] should contain the nickname, starts checking ignoring the @
            // ^found the reciver's cookiejar
                const amount = parseInt(name_amount[1]); //converts whatever's after the @user, could create problems with multiple spaces, gotta check
                isPresent = true;

                if (isNaN(amount)) amount = 1;                      // edit: more spaces will result in the program only giving one cookie, fair enough

                var reciver = users[reciever];
                for (let [giver, cookies] of Object.entries(users)) { //goes trough to find your cookiejar
                    if (giver === nicc){
                    // ^ found your cookiejar
                        var yourcookies = parseInt(textByLine[i].substr(nicc.length+1)) - amount; //calculates your cookies after you give them away (how could you?!?)
                        if (yourcookies < 0) {
                            bot.sendMessage(chatId, "sorry, you don't have enough cookies to give "+ amount + "🍪 :(\n@" + nicc + "'s cookiejar:\n"+ textByLine[i].substr(nicc.length+1) +"🍪");
                        }
                        else{
                            textByLine[i] = nicc + " " + yourcookies;
                            var updatedjar = parseInt(reciver[1]) + amount;
                            textByLine[index] = reciver[0] + " " + updatedjar; //updates the cookiejars involved
                            for (let j = 0; j < textByLine.length; j++)
                                stream.write(textByLine[j]+ "\n"); //gotta rewrite the entire file cuz it's either overrite or nothing :/
                            bot.sendMessage(chatId, "@" + nicc +" gave "+ amount +"🍪 to @"+ reciver[0]);
                        }
                        i = textByLine.length;
                    }
                }
            }
        }
        if (!isPresent) bot.sendMessage(chatId, name_amount[0] + " does not have a cookiejar :(");
    }
    else if(!(msg.reply_to_message == undefined)){ //this fucking statement costed me like half an hour cuz if you don't check this shit bot just gives a polling error
        const reciver = msg.reply_to_message.from.username //takes the username of the replied message
        var amount = parseInt(match[1]); //converts the string in integer
        if (isNaN(amount)) amount = 1;
        for (let index = 0; index < textByLine.length; index++) { //goes through the array to find the reciver
            //console.log(textByLine[index]);
            //console.log(reciver);
            if (textByLine[index].includes(reciver)) { // reciver = nickname the bot needs to give cookies
            // ^found the reciver's cookiejar
                isPresent = true;

                if (isNaN(amount)) amount = 1;

                var recivercookies = textByLine[index].split(" ");
                for (let i = 0; i < textByLine.length; i++) { //goes trough to find your cookiejar
                    if (textByLine[i].includes(nicc)){
                    // ^ found your cookiejar
                        var yourcookies = parseInt(textByLine[i].substr(nicc.length+1)) - amount; //calculates your cookies after you give them away (how could you?!?)
                        if (yourcookies < 0) {
                            bot.sendMessage(chatId, "sorry, you don't have enough cookies to give "+ amount + "🍪 :(\n@" + nicc + "'s cookiejar:\n"+ textByLine[i].substr(nicc.length+1) +"🍪");
                        }
                        else{
                            textByLine[i] = nicc + " " + yourcookies;
                            var updatedjar = parseInt(recivercookies[1]) + amount;
                            textByLine[index] = reciver + " " + updatedjar; //updates the cookiejars involved
                            stream = fs.createWriteStream(directory); 
                            for (let j = 0; j < textByLine.length; j++)
                                stream.write(textByLine[j]+ "\n"); //gotta rewrite the entire file cuz it's either overrite or nothing :/
                            bot.sendMessage(chatId, "@" + nicc +" gave "+ amount +"🍪 to @"+ reciver);
                        }
                        i = textByLine.length;
                    }
                }
            }
        }
        if (!isPresent) bot.sendMessage(chatId, reciver + " does not have a cookiejar :(");  
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
        const chatId= msg.chat.id;
        const nicc = msg.from.username; //takes the chatid and the nickname
        if(msg.reply_to_message == undefined) //prevents the polling error from ealrier in case the message isn't a reply
        bot.sendMessage(chatId,"how to use the /give command:\n1. /give (your message needs to be a reply)\n2. /give <amount> (needs to be a reply)\n3. /give @username <amount>");
        else
        giveCookies(chatId, nicc, msg.reply_to_message.from.username, 1)
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
    const fruit = toString(match[1])
    const chatid = msg.chat.id
    const nicc = msg.from.username
    const prize = Math.floor(Math.random() * 8) + 3
    var winner
    modcookie(nicc,-1,"/cookiefruit fee")
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
        bot.sendMessage(chatid, "rolled "+ winner +" for "+msg.from.name+"'s game\nfruit bet: "+fruit)
        if (fruit === winner) {
            bot.sendMessage(chatid, "congratulations!\n@"+ nicc +" won "+prize+"🍪")
            modcookie(nicc,prize,"/cookiefruit win")
        }
        else{
            bot.sendMessage(chatid,"better luck next time "+ msg.from.name+" :(\n")
        }
    }
});

bot.onText(/\/coockieslot (.+)/, (msg,match) =>{
    const nicc = msg.from.username
    const chatid = msg.chat.id
    var bet = parseInt(match[1])
    if (isNaN(bet)) bet = 1
    modcookie(nicc,-bet,"/cookieslot fee")
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
    bot.sendMessage(chatid,msg.from.name+"'s roll results:\n"+one+two+three)
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
        bot.sendMessage(chatid,"you won!\n"+bet+"🍪 added to @"+nicc+" cookiejar")
        modcookie(nicc,bet,"/cookieslot win")
    }
    else bot.sendMessage(chatid,"better luck next time @"+nicc+" :^)")
});

bot.onText(/\/coockiechance/, (msg) =>{
    const nicc = msg.from.username
    const chatid = msg.chat.id
    const luck = Math.floor(Math.random() * 100)
    switch (luck) {
        case 0:
            bot.sendMessage(chatid,"you plant a cookie into the ground, it sprouts in a magnificent cookie tree!\n@"+nicc+" gains 10🍪 from the harvest!")
            modcookie(nicc,10,"/coockiechance outcome "+luck)
            break;
        case 1:
            bot.sendMessage(chatid,"since he worked so hard on this bot,\n@LuigiBrosNin gains a 🍪 :D")
            modcookie("LuigiBrosNin", 1,"/coockiechance outcome "+luck)
            break;
        case 2:
            bot.sendMessage(chatid,"your grandma comes to visit you.\n@"+nicc+" gains 1🍪 and a kiss from grandma")
            modcookie(nicc, 1,"/coockiechance outcome "+luck)
            break;
        case 3:
            bot.sendMessage(chatid,"you organize a DnD session so everyone would bring a snack.\n it worked.\n@"+nicc+" gains 4🍪 and the master's handbook")
            modcookie(nicc, 4,"/coockiechance outcome "+luck)
            break;
        case 4:
            bot.sendMessage(chatid,"your local bakery got an overflow of cookies. they give ou some to balance out the issue.\n@"+nicc+" gains 3🍪")
            modcookie(nicc, 3,"/coockiechance outcome "+luck)
            break;
        case 5:
            bot.sendMessage(chatid,"you spent all your savings on the cookie sale at the supermarket. it was a wise choice.\n@"+nicc+" gains 5🍪 from the sale")
            modcookie(nicc, 5,"/coockiechance outcome "+luck)
            break;
        case 6:
            bot.sendMessage(chatid,"you learn how to summon cookies with satanic rituals.\n@"+nicc+" gains 6🍪 and a succubus that can bake cookies")
            modcookie(nicc, 6,"/coockiechance outcome "+luck)
            break;
        case 7:
            bot.sendMessage(chatid,"lady luck smiled to you. you didn't win the lottery, but you found some cookies.\n@"+nicc+" gains 7🍪 and some good luck")
            modcookie(nicc, 7,"/coockiechance outcome "+luck)
            break;
        case 8:
            bot.sendMessage(chatid,"life gave you lemons, so you sold them and bought more cookies.\n@"+nicc+" gains 8🍪 and a lemonade stand")
            modcookie(nicc, 8,"/coockiechance outcome "+luck)
            break;
        case 9:
            bot.sendMessage(chatid,"you found a cup of water from the long lost fountain of youth. you use that water as ingredient for the cookies you were backing\n@"+nicc+" gains 9🍪 and feels a lil older")
            modcookie(nicc, 9,"/coockiechance outcome "+luck)
            break;
        case 10:
            bot.sendMessage(chatid,"you posted a meme everyone enjoyed.\n@"+nicc+" gains 3🍪 and the developer of this bot's approval")
            modcookie(nicc, 3,"/coockiechance outcome "+luck)
            break;
        case 11:
            bot.sendMessage(chatid,"you hacked into this bot and generated yourself some cookies.\n@"+nicc+" gains 9🍪 and you'd better hope admins don't catch you")
            modcookie(nicc, 9,"/coockiechance outcome "+luck)
            break;
        case 12:
            bot.sendMessage(chatid,"you make your way through Hogwarts just to learn how to spawn cookies.\n@"+nicc+" gains 4🍪 and a magic wand")
            modcookie(nicc, 4,"/coockiechance outcome "+luck)
            break;
        case 13:
            bot.sendMessage(chatid,"You offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nYou offer to the shrine, but gain nothing.\nin the end you say \"fuck it\" and open a random chest next to the shrine. it had some cookies.\n@"+nicc+" gains 2🍪 and a gambling addiction")
            modcookie(nicc, 2,"/coockiechance outcome "+luck)
            break;
        case 14:
            bot.sendMessage(chatid,"your life is so miserable, they assign you fairy godparents. you wish the only thing worth wishing.\n@"+nicc+" gains 1🍪, but you don't keep the fairies.\ni'm sorry.")
            modcookie(nicc, 1,"/coockiechance outcome "+luck)
            break;
        case 15:
            bot.sendMessage(chatid,"this message has only 1% chance to pop up and you were so lucky.\n@"+nicc+" gains 1🍪 and now knows a secret.\n that secret is how many prompts the developer wrote for this stupid game")
            modcookie(nicc, 1,"/coockiechance outcome "+luck)
            break;
        case 16:
            bot.sendMessage(chatid,"you unistalled league of legends.\n@"+nicc+" gains 3🍪 and your soul back")
            modcookie(nicc, 3,"/coockiechance outcome "+luck)
            break;
        case 17:
            bot.sendMessage(chatid,"you finally pass the logic exam.\n@"+nicc+" gains 999🍪 and 9 CFU.\n(just kidding, you only gain 5. i'm sorry)")
            modcookie(nicc, 5,"/coockiechance outcome "+luck)
            break;
        case 18:
            bot.sendMessage(chatid,"you start a notion, gaining everyone's trust and respect.\n@"+nicc+" gains 8🍪")
            modcookie(nicc, 8,"/coockiechance outcome "+luck)
            break;
        case 19:
            bot.sendMessage(chatid,"you discover that cookie clicker exists.\n@"+nicc+" gains 1🍪 and addiction to the game")
            modcookie(nicc, 1,"/coockiechance outcome "+luck)
            break;
        case 20:
            bot.sendMessage(chatid,"you start working in a cookie mine as cookiedigger, it pays off.\n@"+nicc+" gains 4🍪 and Klondike nostalgia")
            modcookie(nicc, 4,"/coockiechance outcome "+luck)
            break;
        case 21:
            bot.sendMessage(chatid,"you open up a factory to produce cookies. it bankrupts the next day, but  you keep all production.\n@"+nicc+" gains 6🍪")
            modcookie(nicc, 6,"/coockiechance outcome "+luck)
            break;
        case 22:
            bot.sendMessage(chatid,"you invest some cookies in the cookie stock market. it pays off.\n@"+nicc+" gains 3🍪 and rising stonks")
            modcookie(nicc, 3,"/coockiechance outcome "+luck)
            break;
        case 23:
            bot.sendMessage(chatid,"you build a temple to honor the cookie god. there's no such thing as a cookie god, but you keep the offerings.\n@"+nicc+" gains 4🍪 and a mitre hat with a cookie on it.")
            modcookie(nicc, 4,"/coockiechance outcome "+luck)
            break;
        case 24:
            bot.sendMessage(chatid,"you become CEO of tesla and nasa to explore the universe searching for the legendary cookie planet. banks give full funding on the prject.\n@"+nicc+" gains 7🍪 (and a meme lord)")
            modcookie(nicc, 7,"/coockiechance outcome "+luck)
            break;
        case 25:
            bot.sendMessage(chatid,"you find the philosopher's cookie, that turns gold into cookies. yay!\n@"+nicc+" gains 6🍪, but your mom can't find her wedding ring")
            modcookie(nicc, 6,"/coockiechance outcome "+luck)
            break;
        case 26:
            bot.sendMessage(chatid,"you manage to open up a portal to the cookieverse. you manage to grab some cookies before the portal exploded.\n@"+nicc+" gains 2🍪 and an invasion of cookie monsters")
            modcookie(nicc, 2,"/coockiechance outcome "+luck)
            break;
        case 27:
            bot.sendMessage(chatid,"you discover time traver to bring here cookies before they were eaten.\n@"+nicc+" gains 5🍪 and a time paradox")
            modcookie(nicc, 5,"/coockiechance outcome "+luck)
            break;
        case 28:
            bot.sendMessage(chatid,"you gain control of animatter, so you convert it into cookies.\n@"+nicc+" gains 4🍪")
            modcookie(nicc, 4,"/coockiechance outcome "+luck)
            break;
        case 29:
            bot.sendMessage(chatid,"you manage to convert light itself into cookies. the universe is now pitch black, but you've gained some cookies. it's just hard to find them in the dark\n@"+nicc+" gains 9🍪")
            modcookie(nicc, 9,"/coockiechance outcome "+luck)
            break;
        case 30:
            bot.sendMessage(chatid,"you learn clonation is a thing, so you spend billions into cloning some cookies.\n@"+nicc+" gains 2🍪 and a crippling debt")
            modcookie(nicc, 2,"/coockiechance outcome "+luck)
            break;
        case 31:
            bot.sendMessage(chatid,"you find a cookie on the ground. you better sanitize it before putting it in your cookiejar.\n@"+nicc+" gains 1🍪 and some soap")
            modcookie(nicc, 1,"/coockiechance outcome "+luck)
            break;
        case 32:
            bot.sendMessage(chatid,"you buy a fortune cookie, and inside it instead of an advice there's another cookie!\n@"+nicc+" gains 2🍪 and possible future bad choices")
            modcookie(nicc, 2,"/coockiechance outcome "+luck)
            break;
        case 33:
            bot.sendMessage(chatid,"a stranger offers you a cookie. you accept despite mom's warnings.\n@"+nicc+" gains 1🍪 and a drug addiction")
            modcookie(nicc, 1,"/coockiechance outcome "+luck)
            break;
        case 34:
            bot.sendMessage(chatid,"you ask santa Claus for cookies. you learn he isn't real, but you can keep the cookies you left for him.\n@"+nicc+" gains 3🍪 and a cup of milk")
            modcookie(nicc, 3,"/coockiechance outcome "+luck)
            break;
        case 35:// gap i left cuz i'm waiting for some other possibly good commands from alice
            bot.sendMessage(chatid,"you learn how to actually bake cookies.\n@"+nicc+" gains 5🍪 and a new skill")
            modcookie(nicc, 5,"/coockiechance outcome "+luck)
            break;
        case 40:
            bot.sendMessage(chatid,"while you were taking your cookiejar out for a walk, you trip, letting some cookies fly away.\n@"+nicc+" loses 2🍪")
            modcookie(nicc, -2,"/coockiechance outcome "+luck)
            break;
        case 41:
            bot.sendMessage(chatid,"a zombie invades your house, eating your cookies. another one eats your cousin's brain, but who cares.\n@"+nicc+" loses 3🍪 and a cousin")
            modcookie(nicc, -3,"/coockiechance outcome "+luck)
            break;
        case 42:
            bot.sendMessage(chatid,"you ask santa Claus for cookies.\nhe saw your internet history.\n@"+nicc+" loses 1🍪 but you learn to use incognito")
            modcookie(nicc, -1,"/coockiechance outcome "+luck)
            break;
        case 43:
            bot.sendMessage(chatid,"you die. there's nothing after death, just endless darkness. someone steals some cookies from you. you come back to life knowing you cookies are in danger, but it's too late.\nwelp, at least you're alive.\n@"+nicc+" loses 2🍪 but gains depression")
            modcookie(nicc, -2,"/coockiechance outcome "+luck)
            break;
        case 44:
            bot.sendMessage(chatid,"the succubus you summoned demands payment.\n@"+nicc+" loses 2🍪 and your soul is now tied to hell")
            modcookie(nicc, -2,"/coockiechance outcome "+luck)
            break;
        case 45:
            bot.sendMessage(chatid,"since he worked so hard for this bot, you decide to give the developer a cookie to show your appreciation.\n@"+nicc+" loses 1🍪 but gains a personal thanks from the dev")
            giveCookies(chatid,nicc,"LuigiBrosNin",1)
            break;
        case 46:
            bot.sendMessage(chatid,"you're a simp. you donate some of your cookies to a twitch thot.\n@"+nicc+" loses 5🍪 and your dignity.")
            modcookie(nicc, -5,"/coockiechance outcome "+luck)
            break;
        case 47:
            bot.sendMessage(chatid,"the lizard man asks to accept his cookies. you do, but he instantly sells all your info along with some of your cookies.\n@"+nicc+" loses 4🍪 and your privacy, but now you have a facebook account")
            modcookie(nicc, -4,"/coockiechance outcome "+luck)
            break;
        case 48:
            var index = Math.floor(Math.random() * users.length)
            bot.sendMessage(chatid,"@"+Object.keys(users)[index]+" found a way to hijack your cookiejar and stole a cookie!\n@"+nicc+" loses 1🍪\nbut @"+Object.keys(users)[index]+" gains a 🍪!")
            giveCookies(chatid,nicc,Object.keys(users)[index], 1)
            break;
        case 49:
            var index = Math.floor(Math.random() * users.length)
            bot.sendMessage(chatid,"@"+Object.keys(users)[index]+" stole a cookie while you were in horny jail\n@"+nicc+" loses 1🍪\nbut @"+Object.keys(users)[index]+" gains a 🍪!")
            giveCookies(chatid,nicc,Object.keys(users)[index], 1)
            break;
        case 50:
            bot.sendMessage(chatid,"bro, that way pretty cringe ngl.\n@"+nicc+" loses 3🍪 and the \"memelord\" tag")
            modcookie(nicc, -3,"/coockiechance outcome "+luck)
            break;
        case 51:
            bot.sendMessage(chatid,"your illegal cookie traffic got caught and the merch got confiscated.\n@"+nicc+" loses 4🍪 and you'll likely go to jail")
            modcookie(nicc, -4,"/coockiechance outcome "+luck)
            break;
        case 52:
            bot.sendMessage(chatid,"literally nothing happens.\n@"+nicc+" loses 1🍪 cuz i'm evil")
            modcookie(nicc, -1,"/coockiechance outcome "+luck)
            break;
        case 53: //keep going from here.
            bot.sendMessage(chatid,"\n@"+nicc+" loses 1🍪 cuz i'm evil")
            modcookie(nicc, -1,"/coockiechance outcome "+luck)
            break;
        default:
            break;
    }
});
