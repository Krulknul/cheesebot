import { DateTime } from "luxon";
import { BaseCommandHandler, MyContext } from "./abstraction"
import { User } from "./database";
import { adminOnly } from "./middleware";

export class GiveCommand extends BaseCommandHandler {
    command = "give";
    description = "Give someone else your hard-earned cheese";
    async handle(ctx: MyContext) {
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
    }
}


export class BestowCommand extends BaseCommandHandler {
    command = "bestow";
    addToList = false
    middlewares = [adminOnly]
    async handle(ctx: MyContext) {
        const userId = ctx.from?.id
        const bestoweeId = ctx.message?.reply_to_message?.from?.id
        const bestoweeName = ctx.message?.reply_to_message?.from?.first_name
        if (!userId) {
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
        if (!cheeseCount || cheeseCount < 1) {
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
    }
}