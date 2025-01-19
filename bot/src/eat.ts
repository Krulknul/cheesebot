import { DateTime } from "luxon";
import { BaseCommandHandler, MyContext } from "./abstraction";
import { cheeses } from "./cheeses";
import { notInMain } from "./middleware";
import { User } from "./database";
import { InputFile } from "grammy";

export class EatCommand extends BaseCommandHandler {
    command = "eat";
    description = "Eat a cheese";
    middlewares = [notInMain]
    async handle(ctx: MyContext) {
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
${"💯".repeat(hundreds) + "🔟".repeat(tens) + "🧀".repeat(ones)}`, { parse_mode: "HTML" });
    }
}

export class EaterboardCommand extends BaseCommandHandler {
    command = "eaterboard";
    description = "View the current cheese ranks";
    async handle(ctx: MyContext) {
        const allUsers = await ctx.db.db.prepare('SELECT * FROM kvs').all();
        const users = allUsers.map((user: any) => JSON.parse(user.value))
        const sortedUsers = users.sort((a: User, b: User) => b.cheeseCount - a.cheeseCount)
        const topUsers = sortedUsers.slice(0, 10)
        const topUsersString = topUsers.map((user, index) => `${index + 1}. ${user.name} with ${user.cheeseCount == 69 ? '69 ;)' : user.cheeseCount} cheeses 🧀`).join("\n")

        await ctx.reply(`
Eaterboard 🧀
${topUsersString}
`)
    }
}