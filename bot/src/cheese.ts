import { BaseCommandHandler, MyContext } from "./abstraction";
import { cheeses } from "./cheeses";
import { notInMain } from "./middleware";

export class CheeseCommand extends BaseCommandHandler {
    command = "cheese";
    description = "Get a random cheese";
    middlewares = [notInMain]
    async handle(ctx: MyContext) {
        const cheese = cheeses[Math.floor(Math.random() * cheeses.length)]
        await ctx.replyWithPhoto(cheese.image, { parse_mode: "HTML", caption: `<strong>${cheese.name}</strong> 🧀` });
    }
}


export class CheeseCheeseCheeseCommand extends BaseCommandHandler {
    command = "cheesecheesecheese";
    description = "CHEESE CHEESE CHEESE"
    async handle(ctx: MyContext) {
        await ctx.reply("CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE ");
    }
}