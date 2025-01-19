import { Context } from "grammy";
import { DatabaseService } from "./database";
import { EnvironmentVariables } from "./environment";

export interface CustomContext extends Context {
    environment: EnvironmentVariables;
    db: DatabaseService;
    map: Map<string, any>;
}
export type MyContext = CustomContext;

export interface CommandHandler {
    command: string;
    description: string;
    middlewares: ((ctx: MyContext, next: () => Promise<void>) => Promise<void>)[]
    addToList: boolean;
    handle: (ctx: MyContext) => Promise<void>;
    handlePlainMessage: (ctx: MyContext) => Promise<void>;
}

export class BaseCommandHandler implements CommandHandler {
    command = "";
    description = "";
    middlewares = new Array
    addToList = true
    async handle(ctx: MyContext) {
        await ctx.reply("not implemented");
    }
    async handlePlainMessage(ctx: MyContext) {
        return
    }
}