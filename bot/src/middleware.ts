import { MyContext } from "./abstraction"
import { mainChatID, myUserId } from "./constants"

export async function notInMain(ctx: MyContext, next: () => Promise<void>) {
    console.log(ctx.chat?.id)
    if (ctx.chat?.id == mainChatID) {
        return
    }
    await next()
}

export async function adminOnly(ctx: MyContext, next: () => Promise<void>) {
    if (ctx.from?.id == myUserId) {
        await next()
    }
}