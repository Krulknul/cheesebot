import { Bot, Context } from "grammy";
import { EnvironmentVariables } from './environment';
import { DatabaseService } from "./database";
import { DateTime } from "luxon";


export interface CustomContext extends Context {
    environment: EnvironmentVariables;
    db: DatabaseService;
    map: Map<string, any>;
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
        name: "Hushållsost",
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
    },
    {
        name: "Mozzarella",
        image: "https://www.sante.nl/wp-content/uploads/2018/01/hoe-bewaar-je-mozzarella.jpg"
    },
    {
        name: "Parmesan",
        image: "https://assets.clevelandclinic.org/transform/0a272376-d2c4-4936-8239-7c7ef2e5b4e9/ParmesanCheese-471343790-770x533-1_jpg"
    },
    {
        name: "Feta",
        image: "https://cheesemaking.com/cdn/shop/products/Feta_hero.jpg?v=1529434179&width=2048"
    },
    {
        name: "Grated cheese",
        image: "https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_487/k%2Farchive%2F7c3d16375500d7747f651a0d335f83cfa8a4654e"
    }
]

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


bot.command("cheese", async (ctx) => {
    const cheese = cheeses[Math.floor(Math.random() * cheeses.length)]
    console.log(cheese)
    await ctx.reply(`${cheese.name}\n<a href="${cheese.image}">📸</a> `, { parse_mode: "HTML" });
});

bot.command("cheesecheesecheese", async (ctx) => {

    await ctx.reply("CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE CHEESE ");
});

interface User {
    id: number;
    name: string;
    cheeseCount: number;
    lastEaten: string;
}

bot.command("eat", async (ctx) => {
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

    await ctx.reply(`${ctx.from?.first_name} eats one whole ${cheese.name}. foocking delicious 🧀
their cheese count: <strong>${user.cheeseCount}</strong> cheeses so far.
come back again in <strong>an hour</strong> for moar
${"🧀".repeat(user.cheeseCount)}
`, { parse_mode: "HTML" });
})

bot.command("eaterboard", async (ctx) => {
    const allUsers = await ctx.db.db.prepare('SELECT * FROM kvs').all();
    const users = allUsers.map((user: any) => JSON.parse(user.value))
    const sortedUsers = users.sort((a: User, b: User) => b.cheeseCount - a.cheeseCount)
    const topUsers = sortedUsers.slice(0, 10)
    const topUsersString = topUsers.map((user, index) => `${index + 1}. ${user.name} with ${user.cheeseCount == 69 ? '69 ;)' : user.cheeseCount} cheeses 🧀`).join("\n")

    await ctx.reply(`
Eaterboard 🧀
${topUsersString}
`)
})


// command to guess which cheese it is. Shows pic of a cheese and a keyboard to guess. Only pressable by the user who initiated the command

bot.command("guess", async (ctx) => {
    const userId = ctx.from!.id
    const randomCheese = () => cheeses[Math.floor(Math.random() * cheeses.length)]
    const cheese = randomCheese()
    const wrongCheese = randomCheese()
    const wrongCheese2 = randomCheese()
    const keyboard = [cheese, wrongCheese, wrongCheese2].map((cheese) => [{ text: "I guess... It's " + cheese.name }])
    await ctx.reply(ctx.from?.first_name + `, guess the cheese! 🧀
 <a href="${cheese.image}">📸</a>
        `, {
        reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true
        }, parse_mode: "HTML"
    });

    const key = userId.toString() + ":guess"
    ctx.map.set(key, cheese)
})

bot.on(":text", async (ctx) => {
    const userId = ctx.from!.id
    const key = userId.toString() + ":guess"
    console.log(ctx.map)
    const cheese = ctx.map.get(key)
    if (!cheese) {
        return
    }
    if (ctx.message!.text == "I guess... It's " + cheese.name) {
        await ctx.reply("Correct! 🧀")
    } else {
        await ctx.reply("Wrong! 🧀")
    }
    ctx.map.delete(key)
})


await bot.start();