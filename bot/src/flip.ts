import { BaseCommandHandler, MyContext } from "./abstraction";
import { notInMain } from "./middleware";
import { User } from "./database";

export class FlipCommand extends BaseCommandHandler {
    command = "flip";
    description = "Bet on a coin flip with your $CHEESE";
    middlewares = [notInMain]
    async handle(ctx: MyContext) {
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
    }
}