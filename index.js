const TelegramBot = require('node-telegram-bot-api');

const token = '282811649:AAHrmy3pXmhAUs9vDrvJJLaX2IBKGRF6aiQ';

const bot =new TelegramBot (token, {polling: true});

const directory = "./users.json";// ~/unibot/users.json  <- change the location with the server directory

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

function modcookie(username, amount) { //adds an amount of cookies in the username's cookiejar
    if (users[username] < 0) users[username] = 0
    users[username] += amount
    writeUsers()
}

function giveCookies(chatId, giver, reciever, amount){
    users[giver] -= amount
    users[reciever] += amount
    writeUsers()
    bot.sendMessage(chatId, "@" + giver +" gave "+ amount +"🍪 to @"+ reciever)
}

bot.onText(/\/cookiejar/, (msg) =>{
    const chatId = msg.chat.id;
    const nicc = msg.from.username; //takes the chatid and the nickname
    console.log(users); //prints the list on console, for debug purposes
    var isPresent = false;
    for (let [user, cookies] of Object.entries(users)) { //goes through the dictionary and returns a touple with user, cookie amount pairs
        if (user === nicc) { //when it finds the corresponding nickname sends the cookies you have
            isPresent=true;
            bot.sendMessage(chatId,"@" + nicc + "'s cookiejar:\n"+ users[nicc] +"🍪");
            break
        }
    }
    if (!isPresent) { //if the user is a new user, creates a new cookiejar with 10 cookies in it
        users[nicc] = 10
        writeUsers()
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
        const amount = parseInt(match[1]); //converts the string in integer
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

// game ideas: choose an emoji, pick a random emoji between a selected type and if it corresponds, give cookies, if not do nothing
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
            "keyboard": [["/cookiechance"] , ["/"], ["/cookiemenu"]]
            }
        });
});

bot.onText(/\/coockiechance/, (msg) =>{
    const nicc = msg.from.username
    const chatid = msg.chat.id
    switch (Math.floor(Math.random() * 100)) {
        case 0:
            bot.sendMessage(chatid,"you plant a cookie into the ground, it sprouts in a magnificent cookie tree!\n@"+nicc+" gains 10🍪 from the harvest!")
            modcookie(nicc,10)
            break;
        case 1:
            bot.sendMessage(chatid,"since he worked so hard on this bot,\n@LuigiBrosNin gains a 🍪 :D")
            modcookie(LuigiBrosNin, 1)
            break;
        case 2:
            bot.sendMessage(chatid,"your grandma comes to visit you.\n@"+nicc+" gains 1🍪 and a kiss from grandma")
            modcookie(nicc, 1)
            break;
        case 3:
            bot.sendMessage(chatid,"you organize a DnD session so everyone would bring a snack.\n it worked.\n@"+nicc+" gains 4🍪 and the master's handbook")
            modcookie(nicc, 4)
            break;
        case 4:
            bot.sendMessage(chatid,"your local bakery got an overflow of cookies. they give ou some to balance out the issue.\n@"+nicc+" gains 3🍪")
            modcookie(nicc, 3)
            break;
        case 5:
            bot.sendMessage(chatid,"you spent all your savings on the cookie sale at the supermarket. it was a wise choice.\n@"+nicc+" gains 5🍪 from the sale")
            modcookie(nicc, 5)
            break;
        case 6:
            bot.sendMessage(chatid,"you learn how to summon cookies with satanic rituals.\n@"+nicc+" gains 6🍪 and a succubus that can bake cookies")
            modcookie(nicc, 6)
            break;
        case 7:
            bot.sendMessage(chatid,"lady luck smiled to you. you didn't win the lottery, but you found some cookies.\n@"+nicc+" gains 7🍪 and some good luck")
            modcookie(nicc, 7)
            break;
        case 8:
            bot.sendMessage(chatid,"life gave you lemons, so you sold them and bought more cookies.\n@"+nicc+" gains 8🍪 and a lemonade stand")
            modcookie(nicc, 8)
            break;
        case 9: //continue from here
            bot.sendMessage(chatid,"\n@"+nicc+" gains 9🍪 and a succubus that can bake cookies")
            modcookie(nicc, 6)
            break;
        default:
            break;
    }
});
