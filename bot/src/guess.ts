import { BaseCommandHandler, MyContext } from "./abstraction";
import { cheeses } from "./cheeses";
import { notInMain } from "./middleware";

export class GuessCommand extends BaseCommandHandler {
    command = "guess";
    description = "Guess the cheese lol";
    middlewares = [notInMain];

    async handle(ctx: MyContext): Promise<void> {
        const userId = ctx.from!.id;

        // Utility for picking a random cheese
        const randomCheese = () => cheeses[Math.floor(Math.random() * cheeses.length)];

        // Select the correct cheese and one wrong cheese
        const correctCheese = randomCheese();
        let wrongCheese = randomCheese();

        // Ensure the 'wrongCheese' is not the same as the 'correctCheese'
        while (wrongCheese.name === correctCheese.name) {
            wrongCheese = randomCheese();
        }

        // Put them in an array and shuffle the order
        const options = [correctCheese, wrongCheese];
        options.sort(() => Math.random() - 0.5);

        // Build a simple caption with options "1" and "2"
        const caption = `${ctx.from?.first_name}, guess the cheese!\n\n` +
            `1) ${options[0].name}\n` +
            `2) ${options[1].name}\n\n` +
            `Reply with "1" or "2" to this message!`;

        // Send the photo of the *correct* cheese so the user doesn't know which is correct
        const sentMessage = await ctx.replyWithPhoto(correctCheese.image, {
            caption,
            parse_mode: "HTML",
        });

        // Store session data so we can verify the user’s response
        const correctIndex = options.indexOf(correctCheese); // 0 or 1
        const sessionData = {
            messageId: sentMessage.message_id,
            correctIndex,
        };

        const key = userId.toString() + ":guess";
        ctx.map.set(key, sessionData);
    }

    async handlePlainMessage(ctx: MyContext): Promise<void> {
        const message = ctx.message!.text!;
        // 1) User ID check
        const userId = ctx.from?.id;
        if (!userId) return;

        // 2) Must be replying to a guess message
        const replyToMessageId = ctx.message?.reply_to_message?.message_id;
        if (!replyToMessageId) return;

        // 3) Check if there's an active guess session for this user
        const key = userId.toString() + ":guess";
        const sessionData = ctx.map.get(key);
        if (!sessionData) return;

        // 4) Verify that the user’s reply is for the correct guess message
        if (sessionData.messageId !== replyToMessageId) return;

        // 5) The user’s message must be “1” or “2”
        const guessNumber = parseInt(message.trim(), 10);
        if (isNaN(guessNumber) || guessNumber < 1 || guessNumber > 2) return;

        // 6) Check correctness (correctIndex is 0 or 1; user sends 1 or 2)
        if (guessNumber === sessionData.correctIndex + 1) {
            await ctx.reply("Correct! 🧀");
            // Award cheese here
            const user = await ctx.db.get(userId.toString());
            if (user) {
                const parsedUser = JSON.parse(user);
                parsedUser.cheeseCount += 5;
                await ctx.db.set(userId.toString(), JSON.stringify(parsedUser));
            } else {
                await ctx.reply("User not found in database");
            }
        } else {
            await ctx.reply("Wrong! 🧀");
        }

        // 7) Clear this user’s session so they can’t guess again on the same question
        ctx.map.delete(key);
    }
}