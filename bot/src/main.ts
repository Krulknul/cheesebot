import { Bot, Context, InputFile, Keyboard } from "grammy";
import { EnvironmentVariables } from './environment';
import { DatabaseService, User } from "./database";
import { DateTime } from "luxon";
import { BaseCommandHandler, MyContext } from "./abstraction";
import { adminOnly, notInMain } from "./middleware";
import { cheeses } from "./cheeses";
import { EatCommand, EaterboardCommand } from "./eat";
import { CheeseCheeseCheeseCommand, CheeseCommand } from "./cheese";
import { DislikeCommand, FingerCommand, LikeCommand } from "./imageProcessing";
import { MathCommand } from "./math";
import { FlipCommand } from "./flip";
import { CheeseBalanceCommand } from "./cheeseBalance";
import { GuessCommand } from "./guess";
import { BestowCommand, GiveCommand } from "./give";
import { EmojiPuzzleCommand } from "./puzzle";



const environmentVariables = new EnvironmentVariables();
const database = new DatabaseService(environmentVariables.databaseUrl?.split(':')[1]!);

export const bot = new Bot<MyContext>(environmentVariables.botToken);






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

// bot.command("puzzle", onPuzzle);






const commands = [
    new EatCommand,
    new CheeseCommand,
    new MathCommand,
    new DislikeCommand,
    new LikeCommand,
    new FingerCommand,
    new FlipCommand,
    new GiveCommand,
    new BestowCommand,
    new CheeseBalanceCommand,
    new CheeseCommand,
    new GuessCommand,
    new CheeseCheeseCheeseCommand,
    new EaterboardCommand,
    new EmojiPuzzleCommand
]

// Set the bot's commands
const commandDescriptions = commands
    .filter(command => command.addToList)
    .map(command => {
        return {
            command: command.command,
            description: command.description
        }
    })
await bot.api.setMyCommands(commandDescriptions)

// Register the commands
commands.forEach(command => {
    bot.command(command.command, ...command.middlewares, command.handle)
})

bot.on('message:text', async (ctx) => {
    commands.forEach(command => {
        command.handlePlainMessage(ctx)
    })
});

await bot.start();