import { Bot, Context, Keyboard } from "grammy";
import { EnvironmentVariables } from './environment';
import { DatabaseService } from "./database";
import { DateTime } from "luxon";
import sharp from 'sharp';

const myUserId = 6277298559


export interface CustomContext extends Context {
    environment: EnvironmentVariables;
    db: DatabaseService;
    map: Map<string, any>;
}
export type MyContext = CustomContext;


const environmentVariables = new EnvironmentVariables();
const database = new DatabaseService(environmentVariables.databaseUrl?.split(':')[1]!);

export const bot = new Bot<MyContext>(environmentVariables.botToken);



import fs from 'fs';

const cheeses = JSON.parse(fs.readFileSync("./cheeses.json").toString())


console.log(cheeses)



const map = new Map<string, any>();

export async function setConstantsMiddleware(ctx: MyContext, next: () => Promise<void>) {
    ctx.environment = environmentVariables;
    ctx.db = database;
    ctx.map = map
    await next();
}

bot.use(setConstantsMiddleware)


bot.catch(
    (ctx) => {
        console.error(ctx.error);
    }
)


bot.command("cheese", async (ctx) => {
    const cheese = cheeses[Math.floor(Math.random() * cheeses.length)]
    await ctx.replyWithPhoto(cheese.image, { parse_mode: "HTML", caption: `<strong>${cheese.name}</strong> 🧀` });
});

bot.command("cheesecheesecheese", async (ctx) => {
    await ctx.reply("CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE ");
});

interface User {
    id: number;
    name: string;
    cheeseCount: number;
    lastEaten: string;
}

bot.command("eat", async (ctx) => {
    const userId = ctx.from?.id
    if (!userId) {
        return
    }
    const firstName = ctx.from?.first_name
    if (!firstName) {
        return
    }
    const cheese = cheeses[Math.floor(Math.random() * cheeses.length)]
    const userString = await ctx.db.get(userId.toString())
    let user: User = userString ? JSON.parse(userString) : null

    const now = DateTime.now()

    if (user) {
        const lastEaten = DateTime.fromISO(user.lastEaten)
        const thresholdTime = lastEaten.plus({ hours: 1 })
        if (now < thresholdTime) {
            const waitMinutes = Math.ceil(thresholdTime.diff(now, 'minutes').minutes)
            await ctx.reply(`eat again in ${waitMinutes == 1 ? 'less than one minute' : `${waitMinutes} minutes`} 🧀`)
            return
        }
    }

    if (user) {
        console.log(user)
        user = {
            ...user,
            cheeseCount: user.cheeseCount + 1,
            lastEaten: now.toISO()
        } as User
        await ctx.db.set(userId.toString(), JSON.stringify(user))
    } else {
        user = {
            id: userId,
            name: firstName,
            cheeseCount: 1,
            lastEaten: now.toISO()
        } as User
        await ctx.db.set(userId.toString(), JSON.stringify(user))
    }
    console.log(user)
    const hundreds = Math.floor(user.cheeseCount / 100)
    const remainder = user.cheeseCount % 100
    const tens = Math.floor(remainder / 10)
    const ones = remainder % 10

    await ctx.reply(`${ctx.from?.first_name} eats one whole ${cheese.name}. foocking delicious 🧀
their cheese count: <strong>${user.cheeseCount}</strong> cheeses so far.
${"💯".repeat(hundreds) + "🔟".repeat(tens) + "🧀".repeat(ones)}
`, { parse_mode: "HTML" });
})

bot.command("eaterboard", async (ctx) => {
    const allUsers = await ctx.db.db.prepare('SELECT * FROM kvs').all();
    const users = allUsers.map((user: any) => JSON.parse(user.value))
    const sortedUsers = users.sort((a: User, b: User) => b.cheeseCount - a.cheeseCount)
    const topUsers = sortedUsers.slice(0, 10)
    const topUsersString = topUsers.map((user, index) => `${index + 1}. ${user.name} with ${user.cheeseCount == 69 ? '69 ;)' : user.cheeseCount} cheeses 🧀`).join("\n")

    await ctx.reply(`
Eaterboard 🧀
${topUsersString}
`)
})

bot.command("bestow", async (ctx) => {
    const userId = ctx.from?.id
    const bestoweeId = ctx.message?.reply_to_message?.from?.id
    const bestoweeName = ctx.message?.reply_to_message?.from?.first_name
    if (!userId) {
        return
    }
    if (userId != myUserId) {
        ctx.reply("Sorry, ur not kewl enough to bestow cheese out of thin air 🧀")
    }
    if (!bestoweeId) {
        return
    }

    const params = ctx.message?.text?.split(" ")
    if (!params) {
        return
    }
    const cheeseCount = parseInt(params[1])
    if (!cheeseCount) {
        return
    }

    const bestoweeString = await ctx.db.get(bestoweeId.toString())
    let bestowee: User = bestoweeString ? JSON.parse(bestoweeString) : null

    if (!bestowee) {
        bestowee = {
            id: bestoweeId,
            name: bestoweeName!,
            cheeseCount: 0,
            lastEaten: DateTime.now().toISO()
        }
        ctx.db.set(bestoweeId.toString(), JSON.stringify(bestowee))
    }
    bestowee.cheeseCount += cheeseCount
    await ctx.db.set(bestoweeId.toString(), JSON.stringify(bestowee))
    await ctx.reply(`RÅTTA dev bestowed ${cheeseCount} cheeses upon ${bestoweeName} 🧀
${bestoweeName} now has ${bestowee.cheeseCount} cheeses`)

})

// give the other users some cheese
bot.command('give', async (ctx) => {
    const userId = ctx.from?.id
    const recipientId = ctx.message?.reply_to_message?.from?.id
    const recipientName = ctx.message?.reply_to_message?.from?.first_name
    if (!userId) {
        return
    }
    if (!recipientId) {
        return
    }
    if (userId == recipientId) {
        await ctx.reply("You can't give cheese to yourself 🧀")
        return
    }

    const params = ctx.message?.text?.split(" ")
    if (!params) {
        return
    }
    const cheeseCount = parseInt(params[1])
    if (!cheeseCount || cheeseCount < 1) {
        return
    }

    const userString = await ctx.db.get(userId.toString())
    let user: User = userString ? JSON.parse(userString) : null

    if (!user) {
        await ctx.reply("You have no cheeses 🧀")
        return
    }

    if (user.cheeseCount < cheeseCount) {
        await ctx.reply("You don't have enough cheeses 🧀")
        return
    }

    const recipientString = await ctx.db.get(recipientId.toString())
    let recipient: User = recipientString ? JSON.parse(recipientString) : null

    if (!recipient) {
        recipient = {
            id: recipientId,
            name: recipientName!,
            cheeseCount: 0,
            lastEaten: DateTime.now().toISO()
        }
        ctx.db.set(recipientId.toString(), JSON.stringify(recipient))
    }
    recipient.cheeseCount += cheeseCount
    user.cheeseCount -= cheeseCount
    await ctx.db.set(userId.toString(), JSON.stringify(user))
    await ctx.db.set(recipientId.toString(), JSON.stringify(recipient))
    await ctx.reply(`You gave ${cheeseCount} cheeses to ${recipientName} 🧀
${recipientName} now has ${recipient.cheeseCount} cheeses
You now have ${user.cheeseCount} cheeses`)
})




bot.command("cheese_balance", async (ctx) => {
    const userId = ctx.from?.id!
    const userString = await ctx.db.get(userId.toString())
    let user: User = userString ? JSON.parse(userString) : null
    if (!user) {
        await ctx.reply("You have no cheeses 🧀")
        return
    }
    const hundreds = Math.floor(user.cheeseCount / 100)
    const remainder = user.cheeseCount % 100
    const tens = Math.floor(remainder / 10)
    const ones = remainder % 10

    await ctx.reply(`You have <strong>${user.cheeseCount}</strong> cheeses 🧀
${"💯".repeat(hundreds) + "🔟".repeat(tens) + "🧀".repeat(ones)}
`, { parse_mode: "HTML" });
})


// command to guess which cheese it is. Shows pic of a cheese and a keyboard to guess. Only pressable by the user who initiated the command

bot.command("guess", async (ctx) => {
    const userId = ctx.from!.id
    const randomCheese = () => cheeses[Math.floor(Math.random() * cheeses.length)]
    const cheese = randomCheese()
    const wrongCheese = randomCheese()
    const options = [cheese, wrongCheese]
    options.sort(() => Math.random() - 0.5)

    const cheeseGuess = (cheese: string) => "I guess... It's " + cheese
    const keyboard = new Keyboard()
        .oneTime(true)
        .selected(true)

    for (const cheese of options) {
        keyboard.text(cheeseGuess(cheese.name))
    }


    // const keyboard = [cheese, wrongCheese, wrongCheese2].map((cheese) => [{ text: "I guess... It's " + cheese.name }])
    const caption = ctx.from?.first_name + `, guess the cheese! 🧀`
    await ctx.replyWithPhoto(cheese.image, {
        caption,
        reply_markup: keyboard, parse_mode: "HTML", reply_parameters: {
            message_id: ctx.message!.message_id
        }
    });

    const key = userId.toString() + ":guess"
    ctx.map.set(key, cheese)
})


bot.command("flip", async (ctx) => {
    // Parse command parameters
    const fee = 2;
    const params = ctx.message?.text?.split(" ");
    if (!params || params.length !== 3) {
        await ctx.reply(`Usage: /flip <amount> <heads/tails> 🧀\nExample: /roll_cheese 50 heads\nFlipping costs ${fee} cheese. 🧀`);
        return;
    }

    const userId = ctx.from?.id;
    if (!userId) return;

    // Parse bet amount
    const betAmount = parseInt(params[1]);
    if (isNaN(betAmount) || betAmount < 1 || betAmount > 200) {
        await ctx.reply("Please bet between 1 and 200 cheese 🧀");
        return;
    }

    // Parse choice
    const choice = params[2].toLowerCase();
    if (choice !== "heads" && choice !== "tails") {
        await ctx.reply("Please choose either 'heads' or 'tails' 🧀");
        return;
    }

    // Get user data
    const userString = await ctx.db.get(userId.toString());
    let user: User = userString ? JSON.parse(userString) : null;

    if (!user || user.cheeseCount < betAmount + fee) {
        await ctx.reply(`You need at least ${betAmount + fee} cheese to make this bet (${betAmount} + ${fee} fee) 🧀`);
        return;
    }

    // Deduct the fee
    user.cheeseCount -= fee;

    // Perform the coin flip
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = choice === result;

    for (let i = 0; i < 3; i++) {
        await ctx.reply(".");
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Calculate results
    if (won) {
        user.cheeseCount += betAmount * 2;
        await ctx.reply(`The coin lands on ${result}! You won ${betAmount} cheese! 🧀\nNew balance: ${user.cheeseCount} cheese`);
    } else {
        user.cheeseCount -= betAmount;
        await ctx.reply(`The coin lands on ${result}! You lost ${betAmount} cheese! 🧀\nNew balance: ${user.cheeseCount} cheese`);
    }

    // Save updated user data
    await ctx.db.set(userId.toString(), JSON.stringify(user));
});

bot.on(":text", async (ctx) => {
    const userId = ctx.from!.id
    const key = userId.toString() + ":guess"
    console.log(ctx.map)
    const cheese = ctx.map.get(key)
    if (!cheese) {
        return
    }
    if (ctx.message!.text == "I guess... It's " + cheese.name) {
        await ctx.reply("Correct! 🧀")
    } else {
        await ctx.reply("Wrong! 🧀 It's actually " + cheese.name)
    }
    ctx.map.delete(key)
})


await bot.start();