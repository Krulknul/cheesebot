import { Bot, Context, InputFile, Keyboard } from "grammy";
import { EnvironmentVariables } from './environment';
import { DatabaseService } from "./database";
import { DateTime } from "luxon";
import sharp from 'sharp';

const myUserId = 6277298559
const mainChatID = 1002305482036


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


async function notInMain(ctx: MyContext, next: () => Promise<void>) {
    if (ctx.chat?.id == mainChatID) {
        return
    }
    await next()
}


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

/**
 * This function takes a photo buffer, a watermark file path,
 * and an option for watermark gravity ("southeast", "northeast", etc.),
 * then returns a processed Buffer with the watermark applied.
 */
export async function processImageWithWatermark(
    originalImageBuffer: ArrayBuffer,
    watermarkPath: string,
    botToken: string,
    gravity: "southeast" | "northeast" | "southwest" | "northwest" // or whichever you need
): Promise<Buffer> {
    // Get dimensions of input image
    const metadata = await sharp(Buffer.from(originalImageBuffer)).metadata();
    const width = metadata.width;
    const height = metadata.height;

    if (!width || !height) {
        throw new Error("Could not process image dimensions");
    }

    // Calculate watermark dimensions (1/3 or 1/2, whichever you prefer)
    const watermarkWidth = Math.round(width / 2);
    const watermarkHeight = Math.round(height / 2);

    // Create a resized version of the watermark
    const resizedWatermark = await sharp(watermarkPath)
        .resize(watermarkWidth, watermarkHeight, {
            fit: "inside",
            withoutEnlargement: false,
        })
        .toBuffer();

    // Process the image with the watermark
    const processedImageBuffer = await sharp(Buffer.from(originalImageBuffer))
        .composite([
            {
                input: resizedWatermark,
                gravity,
            },
        ])
        .toBuffer();

    return processedImageBuffer;
}

/**
 * The /like command
 */
bot.command("like", async (ctx) => {
    // Check if command is a reply to a photo message
    const photo = ctx.message?.reply_to_message?.photo;
    if (!photo) {
        await ctx.reply("Please reply to a photo message with this command! 🧀");
        return;
    }

    try {
        // Get the largest version of the photo
        const photoFile = photo[photo.length - 1];
        // Download the photo
        const photoInfo = await ctx.api.getFile(photoFile.file_id);
        const photoUrl = `https://api.telegram.org/file/bot${ctx.environment.botToken}/${photoInfo.file_path}`;

        // Fetch the photo data
        const response = await fetch(photoUrl);
        const originalImageBuffer = await response.arrayBuffer();

        // Path to your watermark image
        const watermarkPath = "./like.png";

        // Process the image (bottom-right corner)
        const processedImageBuffer = await processImageWithWatermark(
            originalImageBuffer,
            watermarkPath,
            ctx.environment.botToken,
            "southeast"
        );

        // Send the processed image
        await ctx.replyWithPhoto(new InputFile(processedImageBuffer, "output.jpg"), {
            reply_to_message_id: ctx.message.message_id,
        });
    } catch (error) {
        console.error("Error processing image:", error);
        await ctx.reply("Sorry, there was an error processing the image 🧀");
    }
});

/**
 * The /dislike command
 */
bot.command("dislike", async (ctx) => {
    // Check if command is a reply to a photo message
    const photo = ctx.message?.reply_to_message?.photo;
    if (!photo) {
        await ctx.reply("Please reply to a photo message with this command! 🧀");
        return;
    }

    try {
        // Get the largest version of the photo
        const photoFile = photo[photo.length - 1];
        // Download the photo
        const photoInfo = await ctx.api.getFile(photoFile.file_id);
        const photoUrl = `https://api.telegram.org/file/bot${ctx.environment.botToken}/${photoInfo.file_path}`;

        // Fetch the photo data
        const response = await fetch(photoUrl);
        const originalImageBuffer = await response.arrayBuffer();

        // Path to your watermark image
        const watermarkPath = "./dislike.png";

        // Process the image (top-right corner)
        const processedImageBuffer = await processImageWithWatermark(
            originalImageBuffer,
            watermarkPath,
            ctx.environment.botToken,
            "northeast"
        );

        // Send the processed image
        await ctx.replyWithPhoto(new InputFile(processedImageBuffer, "output.jpg"), {
            reply_to_message_id: ctx.message.message_id,
        });
    } catch (error) {
        console.error("Error processing image:", error);
        await ctx.reply("Sorry, there was an error processing the image 🧀");
    }
});

bot.command("finger", async (ctx) => {
    // Check if command is a reply to a photo message
    const photo = ctx.message?.reply_to_message?.photo;
    if (!photo) {
        await ctx.reply("Please reply to a photo message with this command! 🧀");
        return;
    }

    try {
        // Get the largest version of the photo
        const photoFile = photo[photo.length - 1];
        // Download the photo
        const photoInfo = await ctx.api.getFile(photoFile.file_id);
        const photoUrl = `https://api.telegram.org/file/bot${ctx.environment.botToken}/${photoInfo.file_path}`;

        // Fetch the photo data
        const response = await fetch(photoUrl);
        const originalImageBuffer = await response.arrayBuffer();

        // Path to your watermark image
        const watermarkPath = "./finger.png";

        // Process the image (top-right corner)
        const processedImageBuffer = await processImageWithWatermark(
            originalImageBuffer,
            watermarkPath,
            ctx.environment.botToken,
            "southeast"
        );

        // Send the processed image
        await ctx.replyWithPhoto(new InputFile(processedImageBuffer, "output.jpg"), {
            reply_to_message_id: ctx.message.message_id,
        });
    } catch (error) {
        console.error("Error processing image:", error);
        await ctx.reply("Sorry, there was an error processing the image 🧀");
    }
});


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

bot.command("eat", notInMain, async (ctx) => {
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
            await ctx.replyWithPhoto(new InputFile("./eat.png"))
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
        return
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
// Add this near the top with other interface declarations
interface MathProblem {
    question: string;
    answer: number;
}

// command to guess which cheese it is. Shows pic of a cheese and a keyboard to guess. Only pressable by the user who initiated the command

bot.command("guess", notInMain, async (ctx) => {
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

bot.command("flip", notInMain, async (ctx) => {
    // Parse command parameters
    const feePercentage = 10; // 10% fee
    const maxAmount = 1000000;
    const params = ctx.message?.text?.split(" ");
    if (!params || params.length !== 3) {
        await ctx.reply(`Usage: /flip <amount/saudi> <heads/tails> 🧀\nExample: /flip 50 heads\nUse 'saudi' to bet all your cheese!\nFlipping costs ${feePercentage}% of your bet in cheese. 🧀`);
        return;
    }

    const userId = ctx.from?.id;
    if (!userId) return;

    // Get user data first since we need it for 'saudi' option
    const userString = await ctx.db.get(userId.toString());
    let user: User = userString ? JSON.parse(userString) : null;

    if (!user || user.cheeseCount < 1) {
        await ctx.reply(`You don't have any cheese! 🧀`);
        return;
    }

    // Parse bet amount
    let betAmount: number;
    if (params[1].toLowerCase() === "saudi") {
        // Calculate max possible bet considering the fee
        betAmount = Math.floor(user.cheeseCount / (1 + feePercentage / 100));
    } else {
        betAmount = parseInt(params[1]);
        if (isNaN(betAmount) || betAmount < 1 || betAmount > maxAmount) {
            await ctx.reply(`Please bet between 1 and ${maxAmount} cheese 🧀`);
            return;
        }
    }

    // Calculate fee as percentage of bet amount
    const fee = Math.floor((betAmount * feePercentage) / 100);

    // Parse choice
    const choice = params[2].toLowerCase();
    if (choice !== "heads" && choice !== "tails") {
        await ctx.reply("Please choose either 'heads' or 'tails' 🧀");
        return;
    }

    if (user.cheeseCount < betAmount + fee) {
        await ctx.reply(`You need at least ${betAmount + fee} cheese to make this bet (${betAmount} + ${fee} fee) 🧀`);
        return;
    }

    // Deduct the fee and bet amount upfront
    user.cheeseCount -= (fee + betAmount);

    // Perform the coin flip
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = choice === result;

    for (let i = 0; i < 3; i++) {
        await ctx.reply(".");
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate results
    if (won) {
        // On win, add back the bet amount plus the winnings
        user.cheeseCount += betAmount * 2;
        await ctx.reply(`The coin lands on ${result}! You won ${betAmount} cheese! 🧀\nNew balance: ${user.cheeseCount} cheese`,
            { reply_to_message_id: ctx.message!.message_id }
        );
    } else {
        // On loss, the bet amount is already deducted
        await ctx.reply(`The coin lands on ${result}! You lost ${betAmount} cheese! 🧀\nNew balance: ${user.cheeseCount} cheese`,
            { reply_to_message_id: ctx.message!.message_id }
        );
    }

    // Save updated user data
    await ctx.db.set(userId.toString(), JSON.stringify(user));
});


interface MathProblem {
    question: string;
    answer: number;
}

function generateMultiOperation(): MathProblem {
    // Generate a problem with two operations
    const operations = ['+', '-', '*'];
    const op1 = operations[Math.floor(Math.random() * operations.length)];
    const op2 = operations[Math.floor(Math.random() * operations.length)];

    const num1 = Math.floor(Math.random() * 50) + 1;
    const num2 = Math.floor(Math.random() * 50) + 1;
    const num3 = Math.floor(Math.random() * 20) + 1;

    // Use parentheses randomly
    const useParens = Math.random() < 0.5;

    if (useParens) {
        const question = `(${num1} ${op1} ${num2}) ${op2} ${num3}`;
        let intermediateResult;
        switch (op1) {
            case '+': intermediateResult = num1 + num2; break;
            case '-': intermediateResult = num1 - num2; break;
            case '*': intermediateResult = num1 * num2; break;
            default: intermediateResult = num1 + num2;
        }

        let finalResult;
        switch (op2) {
            case '+': finalResult = intermediateResult + num3; break;
            case '-': finalResult = intermediateResult - num3; break;
            case '*': finalResult = intermediateResult * num3; break;
            default: finalResult = intermediateResult + num3;
        }

        return { question, answer: finalResult };
    } else {
        const question = `${num1} ${op1} ${num2} ${op2} ${num3}`;
        // Handle operator precedence
        let result;
        if ((op2 === '*' && (op1 === '+' || op1 === '-'))) {
            // Multiply first, then add/subtract
            const product = num2 * num3;
            result = op1 === '+' ? num1 + product : num1 - product;
        } else {
            // Evaluate left to right
            let intermediate;
            switch (op1) {
                case '+': intermediate = num1 + num2; break;
                case '-': intermediate = num1 - num2; break;
                case '*': intermediate = num1 * num2; break;
                default: intermediate = num1 + num2;
            }

            switch (op2) {
                case '+': result = intermediate + num3; break;
                case '-': result = intermediate - num3; break;
                case '*': result = intermediate * num3; break;
                default: result = intermediate + num3;
            }
        }
        return { question, answer: result };
    }
}

function generateDivision(): MathProblem {
    // Generate division problems that result in whole numbers
    const answer = Math.floor(Math.random() * 20) + 1;
    const multiplier = Math.floor(Math.random() * 10) + 1;
    const dividend = answer * multiplier;

    return {
        question: `${dividend} ÷ ${multiplier}`,
        answer: answer
    };
}

function generateMathProblem(): MathProblem {
    // 40% chance of multi-operation, 30% chance of division, 30% chance of simple operation
    const problemType = Math.random();

    if (problemType < 0.4) {
        return generateMultiOperation();
    } else if (problemType < 0.7) {
        return generateDivision();
    } else {
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        let num1: number, num2: number;

        switch (operation) {
            case '+':
                num1 = Math.floor(Math.random() * 100) + 1;
                num2 = Math.floor(Math.random() * 100) + 1;
                return {
                    question: `${num1} + ${num2}`,
                    answer: num1 + num2
                };
            case '-':
                num1 = Math.floor(Math.random() * 100) + 51;
                num2 = Math.floor(Math.random() * 50) + 1;
                return {
                    question: `${num1} - ${num2}`,
                    answer: num1 - num2
                };
            case '*':
                num1 = Math.floor(Math.random() * 20) + 1;
                num2 = Math.floor(Math.random() * 20) + 1;
                return {
                    question: `${num1} × ${num2}`,
                    answer: num1 * num2
                };
            default:
                return {
                    question: '1 + 1',
                    answer: 2
                };
        }
    }
}
// Modified math command to store the message ID
bot.command("math", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const problem = generateMathProblem();
    const message = await ctx.reply(`Solve this problem for 10 cheese! 🧀\n${problem.question} = ?`, {
        reply_parameters: {
            message_id: ctx.message!.message_id
        }
    });

    // Store both the problem and the message ID
    const key = `${userId}:math`;
    ctx.map.set(key, {
        problem,
        messageId: message.message_id
    });
    console.log("math problem", problem);
});

// Modified text handler to check for replies
bot.on(":text", async (ctx) => {
    const userId = ctx.from!.id;
    const guessKey = userId.toString() + ":guess";
    const mathKey = userId.toString() + ":math";

    // Handle cheese guess
    const cheese = ctx.map.get(guessKey);
    if (cheese) {
        if (ctx.message!.text == "I guess... It's " + cheese.name) {
            await ctx.reply("Correct! 🧀");
        } else {
            await ctx.reply("Wrong! 🧀 It's actually " + cheese.name);
        }
        ctx.map.delete(guessKey);
        return;
    }

    // Handle math problem
    const mathData = ctx.map.get(mathKey);
    if (mathData && ctx.message?.reply_to_message?.message_id === mathData.messageId) {
        const userAnswer = parseInt(ctx.message.text);
        if (isNaN(userAnswer)) {
            return;
        }

        if (userAnswer === mathData.problem.answer) {
            const userString = await ctx.db.get(userId.toString());
            let user: User = userString ? JSON.parse(userString) : {
                id: userId,
                name: ctx.from!.first_name,
                cheeseCount: 0,
                lastEaten: DateTime.now().toISO()
            };

            user.cheeseCount += 10;
            await ctx.db.set(userId.toString(), JSON.stringify(user));
            await ctx.reply("Correct! Here's 10 cheese! 🧀\nYou now have " + user.cheeseCount + " cheese!", {
                reply_to_message_id: ctx.message.message_id
            });
        } else {
            await ctx.reply("Wrong answer! The correct answer was " + mathData.problem.answer + " 🧀", {
                reply_to_message_id: ctx.message.message_id
            });
        }
        ctx.map.delete(mathKey);
    }
});

await bot.start();