import { Bot, Context } from "grammy";
import { EnvironmentVariables } from './environment';


export interface CustomContext extends Context {
    environment: EnvironmentVariables;
}
export type MyContext = CustomContext;


const environmentVariables = new EnvironmentVariables();

export const bot = new Bot<MyContext>(environmentVariables.botToken);


// // Rate limit users to 3 messages per 2 seconds
// bot.use(limit({
//     timeFrame: 2000,
//     limit: 4,
//     onLimitExceeded: async (ctx) => {
//         console.log(`Rate limit exceeded for user ${ctx.from?.id} with username ${ctx.from?.username}`)
//     },
//     keyGenerator: (ctx) => {
//         return ctx.from?.id.toString()
//     }
// }));

const cheeses = [
    {
        name: "Casu Martzu",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Casu_Marzu_cheese.jpg/640px-Casu_Marzu_cheese.jpg"
    },
    {
        name: "Beemster Old",
        image: "https://beemster.de/wp-content/uploads/2023/10/4Beemster-Old-Laib-stehend-mit-Ecke-und-Wuerfel.jpg"
    }
]




export async function setConstantsMiddleware(ctx: MyContext, next: () => Promise<void>) {
    ctx.environment = environmentVariables;
    await next();
}

bot.use(setConstantsMiddleware)










bot.command("cheese", async (ctx) => {
    const res = await fetch("https://cheese-api.onrender.com/cheese")
    const apiCheeses = await res.json()
    // pick a random cheese
    const allCheeses = cheeses + apiCheeses
    const cheese = allCheeses[Math.floor(Math.random() * allCheeses.length)]
    await ctx.reply(`${cheese.name}\n<a href="${cheese.image}">📸</a> `, { parse_mode: "HTML" });
});


await bot.start();