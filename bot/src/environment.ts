import { configDotenv } from "dotenv";


export class EnvironmentVariables {
    botToken: string;
    databaseUrl: string;

    constructor() {
        configDotenv();

        if (process.env.BOT_TOKEN === undefined) {
            throw new Error("BOT_TOKEN must be provided in the environment variables");
        }
        this.botToken = process.env.BOT_TOKEN;

        if (process.env.DATABASE_URL === undefined) {
            throw new Error("DATABASE_URL must be provided in the environment variables");
        }
        this.databaseUrl = process.env.DATABASE_URL;

        return this;
    }
}