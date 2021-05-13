const TelegramBot = require('node-telegram-bot-api');

const token = '282811649:AAHrmy3pXmhAUs9vDrvJJLaX2IBKGRF6aiQ';

const bot =new TelegramBot (token, {polling: true});

const directory = "D://Cygwin/home/Luizo/cookiejars.txt";// ~/unibot/cookiejars.txt   <- change the location with the server directory

var fs = require ("fs");
const { isUndefined } = require('util');
var stream;
stream = fs.createReadStream(directory);

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

function modcookie(username, amount, directory, textByLine) {//adds an amount of cookies in the username's cookiejar
    for (let index = 0; index < textByLine.length; index++) {
        if(textByLine[index].includes(username)){
            var yourcookies = parseInt(textByLine[index].substr(username.length+1)) + amount;
            if (yourcookies < 0) yourcookies = 0;
            textByLine[index] = username + " "+ yourcookies;
            index = textByLine.length;
        }
    }
    stream = fs.createWriteStream(directory); 
    for (let j = 0; j < textByLine.length; j++) stream.write(textByLine[j]+ "\n");
}

bot.onText(/\/cookiejar/, (msg) =>{
    const chatId= msg.chat.id;
    const nicc = msg.from.username; //takes the chatid and the nickname
    var text = fs.readFileSync(directory).toString('utf-8'); //copies the list of cookiejars in a string
    var textByLine = text.split("\n"); //converts the entire text in an array of strings divided by \n
    console.log(text); //stamps the list on console, for debug purposes
    var isPresent = false;
    for (let index = 0; index < textByLine.length; index++) { //goes through the array
        if (textByLine[index].includes(nicc)) { //when it finds the corresponding nickname sends the cookies you have
            bot.sendMessage(chatId,"@" + msg.from.username + "'s cookiejar:\n"+ textByLine[index].substr(nicc.length+1) +"🍪");
            isPresent=true;
            index = textByLine.length; //if found the index jumps to end the for
        }
    }
    if (!isPresent) { //if the user is a new user, creates a new cookiejar with 10 cookies on it
        fs.appendFile(directory , nicc + " 10\n", (err) => {
            if (err) throw err;
            bot.sendMessage(chatId, "🍪new cookiejar created!🍪\ni created a new cookiejar with the username @"+ nicc +"\n" + "your cookiejar starts with\n" + 10 + "🍪\n go earn some more!");
        });
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
    const chatId= msg.chat.id;
    const nicc = msg.from.username; //takes the chatid and the nickname
    const rec = match[1] //takes the string you wrote (format "@user <amount>")
    var name_amount= rec.split(" ");
    console.log(name_amount);
    var text = fs.readFileSync(directory).toString('utf-8'); //copies the list of cookiejars in a string
    var textByLine = text.split("\n"); //converts the entire text in an array of strings divided by \n
    console.log(textByLine); //stamps the list on console, for debug purposes
    var isPresent = false;
    if (name_amount[0].startsWith("@")) { //threat as /give @ n
        for (let index = 0; index < textByLine.length; index++) { //goes through the array to find the reciver
            console.log(textByLine[index]);
            console.log(name_amount[0].substring(1));
            if (textByLine[index].includes(name_amount[0].substring(1))) { //name_amount[0] should contain the nickname, starts checking ignoring the @
            // ^found the reciver's cookiejar
                const amount = parseInt(name_amount[1]); //converts whatever's after the @user, could create problems with multiple spaces, gotta check
                isPresent = true;

                if (isNaN(amount)) amount = 1;                      // edit: more spaces will result in the program only giving one cookie, fair enough

                var reciver = textByLine[index].split(" ");
                for (let i = 0; i < textByLine.length; i++) { //goes trough to find your cookiejar
                    if (textByLine[i].includes(nicc)){
                    // ^ found your cookiejar
                        var yourcookies = parseInt(textByLine[i].substr(nicc.length+1)) - amount; //calculates your cookies after you give them away (how could you?!?)
                        if (yourcookies < 0) {
                            bot.sendMessage(chatId, "sorry, you don't have enough cookies to give "+ amount + "🍪 :(\n@" + nicc + "'s cookiejar:\n"+ textByLine[i].substr(nicc.length+1) +"🍪");
                        }
                        else{
                            textByLine[i] = nicc + " " + yourcookies;
                            var updatedjar = parseInt(reciver[1]) + amount;
                            textByLine[index] = reciver[0] + " " + updatedjar; //updates the cookiejars involved
                            stream = fs.createWriteStream(directory); 
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
// TODO : organize code and rewrite, maybe with a function, cuz this code works but could be simpler
// pratically i have to move the code from line 68 to 100 in a function that i'll use 3 times, avoiding to rewrite everything again

// game ideas: choose an emoji, pick a random emoji between a selected type and if it corresponds, give cookies, if not do nothing
//             pay a set amount of cookies for rolling a slot machine and recive a multiplier reward or lose cookies

bot.onText(/\/give/, (msg) => { // just /give (needs to be a reply to work) gives 1 cookie without specifying the amount
    if (msg.text.endsWith("/give") && msg.text.lastIndexOf("/give") == 0)
    {
        const chatId= msg.chat.id;
        const nicc = msg.from.username; //takes the chatid and the nickname
        if(msg.reply_to_message == undefined) //prevents the polling error from ealrier in case the message isn't a reply
        bot.sendMessage(chatId,"how to use the /give command:\n1. /give (your message needs to be a reply)\n2. /give <amount> (needs to be a reply)\n3. /give @username <amount>");
        else{
            const reciver = msg.reply_to_message.from.username;
            bot.sendMessage(chatId, "@" + nicc +" gave a 🍪 to @"+ reciver);
            //todo : recall the function i have to write in the todo above
        }
    }
});

bot.onText(/\/games/, (msg) => {
    bot.sendMessage(msg.chat.id, "🕹 games menu! 🎮\n🍀chance: something will happen, you may gain cookies👀\n ", {
        "reply_markup": {
            "keyboard": [["/"] , ["/"], ["/cookiemenu"]]
            }
        });
});
/*
bot.onText(/\/coockiechance/, (msg) =>{
    switch (Math.floor(Math.random() * 100)) {
        case 0:
            bot.sendMessage(msg.chat.id,"you plant a cookie into the ground, it sprouts in a magnificent cookie tree! @"+msg.from.username+" gains 10🍪 from the harvest!");
            break;
    
        default:
            break;
    }
});
*/