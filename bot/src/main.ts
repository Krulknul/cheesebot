import { Bot, Context } from "grammy";
import { EnvironmentVariables } from './environment';
import { DatabaseService } from "./database";


export interface CustomContext extends Context {
    environment: EnvironmentVariables;
    db: DatabaseService;
}
export type MyContext = CustomContext;


const environmentVariables = new EnvironmentVariables();
const database = new DatabaseService(environmentVariables.databaseUrl?.split(':')[1]!);

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
    },
    {
        name: "hushållsost",
        image: "https://igourmet.com/images/PRODUCT/medium/16278_4_.jpg"
    },
    {
        name: "Brie",
        image: "https://cheesemaking.com/cdn/shop/products/brie-recipe.jpg?crop=center&height=1200&v=1533088694&width=1200"
    },
    {
        name: "Pule",
        image: "https://cdn.tasteatlas.com/images/ingredients/0b65c61252874bfe85e00d18e89f8682.jpg?w=600"
    },
    {
        name: "Stilton",
        image: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Blue_Stilton_01.jpg"
    },
    {
        name: "Old Amsterdam",
        image: "https://www.dailyfoodstores.com/cdn/shop/products/OldamsterdamSchuitje300gr_682x.gif?v=1654611027"
    },
    {
        name: "Camembert",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Camembert_de_Normandie_%28AOP%29_11.jpg/640px-Camembert_de_Normandie_%28AOP%29_11.jpg"
    },
    {
        name: "Gouda",
        image: "https://veldhuyzenkaas.nl/wp-content/uploads/2017/01/comp-gouda-min.png"
    },
    {
        name: "Cheddar",
        image: "https://www.streeckhuys.nl/wp-content/uploads/Cheddar.jpeg"
    },
    {
        name: "Pecorino",
        image: "https://upload.wikimedia.org/wikipedia/commons/5/58/Pecorino_romano_on_board_cropped.PNG"
    }
]




export async function setConstantsMiddleware(ctx: MyContext, next: () => Promise<void>) {
    ctx.environment = environmentVariables;
    ctx.db = database;
    await next();
}

bot.use(setConstantsMiddleware)






bot.catch(
    (ctx) => {
        console.error(`Error for`);
    }
)




bot.command("cheese", async (ctx) => {
    const res = await fetch("https://cheese-api.onrender.com/cheeses")
    const apiCheeses = await res.json()
    // pick a random cheese
    const allCheeses = cheeses.concat(apiCheeses)
    const cheese = allCheeses[Math.floor(Math.random() * allCheeses.length)]
    console.log(cheese)
    await ctx.reply(`${cheese.name}\n<a href="${cheese.image}">📸</a> `, { parse_mode: "HTML" });
});

bot.command("cheesecheesecheese", async (ctx) => {

    await ctx.reply("CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE ");
});

bot.command("eat", async (ctx) => {
    const cheese = cheeses[Math.floor(Math.random() * cheeses.length)]
    const cheesevalue = await ctx.db.get(ctx.from!.id.toString())
    if (cheesevalue) {
        await ctx.db.set(ctx.from!.id.toString(), (parseInt(cheesevalue) + 1).toString())
    } else {
        await ctx.db.set(ctx.from!.id.toString(), "1")
    }
    await ctx.reply(`${ctx.from?.first_name} eats one whole ${cheese.name}. foocking delicious 🧀
their cheese count: <strong>${cheesevalue ? parseInt(cheesevalue) + 1 : 1}</strong> cheeses so far.
${"🧀".repeat(cheesevalue ? parseInt(cheesevalue) + 1 : 1)}

`, { parse_mode: "HTML" });
})


await bot.start();