import { BaseCommandHandler, MyContext } from "./abstraction"
import { User } from "./database"


export class CheeseBalanceCommand extends BaseCommandHandler {
    command = "cheese_balance";
    description = "Check your cheese balance";
    async handle(ctx: MyContext) {
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
    }
}
