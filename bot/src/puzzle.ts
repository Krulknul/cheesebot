// import { Bot } from "grammy";
// import { allEmojis } from "./emoji";
// import { bot, MyContext } from "./main";

// interface EmojiPuzzle {
//     chatId: number;
//     puzzle: string[];
//     prizeIndex: number;
//     revealed: boolean[];
//     solved: boolean;
//     messageId: number; // so we can store the posted puzzle's message ID
// }

// const activePuzzles = new Map<number, EmojiPuzzle>();


// /**
//  * Returns an array of N*N random emojis from `allEmojis`. in utf8
//  */
// function getRandomEmojis(n: number): string[] {
//     const emojis = [];
//     for (let i = 0; i < n * n; i++) {
//         emojis.push(allEmojis[Math.floor(Math.random() * allEmojis.length)]);
//     }
//     return emojis;
// }

// async function postEmojiPuzzle(
//     bot: Bot<MyContext>,
//     chatId: number,
//     n = 5 // size of the grid
// ): Promise<void> {
//     // 1. Build the grid
//     const puzzle = getRandomEmojis(n);
//     // 2. Choose random position for the 🧀
//     const prizeIndex = Math.floor(Math.random() * puzzle.length);

//     // 3. Format for message text
//     // e.g. "🍕👺😹♥️💦\n🔥🍌🌶😈😹\n..."
//     let puzzleText = "";
//     for (let i = 0; i < puzzle.length; i++) {
//         puzzleText += puzzle[i];
//         if ((i + 1) % n === 0) puzzleText += "\n"; // newline after every N
//     }

//     // 4. Post the puzzle
//     const message = await bot.api.sendMessage(chatId, `Guess the 🧀:\n\n${puzzleText}`);

//     // 5. Store puzzle data in `activePuzzles`
//     activePuzzles.set(message.message_id, {
//         chatId,
//         puzzle,
//         prizeIndex,
//         revealed: Array(puzzle.length).fill(false),
//         solved: false,
//         messageId: message.message_id,
//     });
// }

// function renderPuzzle(puzzle: EmojiPuzzle): string {
//     const n = Math.sqrt(puzzle.puzzle.length);
//     let result = "";
//     for (let i = 0; i < puzzle.puzzle.length; i++) {
//         if (puzzle.revealed[i]) {
//             // revealed emoji is either 🧀 (if i == prizeIndex) or ❌
//             result += (i === puzzle.prizeIndex) ? "🧀" : "❌";
//         } else {
//             result += puzzle.puzzle[i];
//         }
//         if ((i + 1) % n === 0) result += "\n";
//     }
//     return result;
// }

// export async function onPuzzle(ctx: MyContext) {
//     console.log(ctx.chat)
//     if (!ctx.chat) return; // Safety check in case there's no chat context

//     // You can choose a grid size (N×N). For example, 5×5:
//     const gridSize = 5;

//     // Call your existing function to post and track the puzzle
//     await postEmojiPuzzle(bot, ctx.chat.id, gridSize);

//     // Optional: Acknowledge or confirm the puzzle has started
//     await ctx.reply(`A new ${gridSize}×${gridSize} emoji puzzle has been posted! Reply to it with an emoji to guess where the 🧀 is!`);
// }

// // bot.on("message:text", async (ctx) => {
// //     ctx.reply("This is a text message. Please reply to the puzzle message with an emoji to guess where the 🧀 is!");
// // })

// bot.on("message:text", async (ctx) => {
//     const replyToMsgId = ctx.message.reply_to_message?.message_id;

//     if (!replyToMsgId) return; // not a reply

//     // Is this a reply to an active puzzle?
//     const puzzle = activePuzzles.get(replyToMsgId);
//     if (!puzzle) return;

//     // If puzzle is solved, ignore further guesses (or handle differently if you like)
//     if (puzzle.solved) {
//         await ctx.reply("That puzzle was already solved! 🧀");
//         return;
//     }

//     const guessEmoji = ctx.message.text.trim();
//     const index = puzzle.puzzle.indexOf(guessEmoji);

//     // If guessed emoji isn't even in the puzzle, just ignore or reply "invalid guess"
//     if (index === -1) {
//         await ctx.reply("That emoji is not in the puzzle. Try again! 🧀");
//         return;
//     }

//     // If it's in the puzzle, mark revealed
//     puzzle.revealed[index] = true;

//     // Check if correct
//     if (index === puzzle.prizeIndex) {
//         puzzle.solved = true;
//         // OPTIONAL: award cheese to the user
//         try {
//             const userId = ctx.from?.id;
//             if (userId) {
//                 const userString = await ctx.db.get(userId.toString());
//                 let user: User = userString ? JSON.parse(userString) : {
//                     id: userId,
//                     name: ctx.from?.first_name ?? "Someone",
//                     cheeseCount: 0,
//                     lastEaten: DateTime.now().toISO()
//                 };
//                 user.cheeseCount += 10; // or some other reward
//                 await ctx.db.set(userId.toString(), JSON.stringify(user));

//                 await ctx.reply(
//                     `Correct! ${ctx.from?.first_name} found the 🧀!\nYou earned 10 cheese.\nYour new balance: ${user.cheeseCount} 🧀`
//                 );
//             }
//         } catch (err) {
//             console.error("Error awarding cheese:", err);
//         }
//     } else {
//         // Wrong guess
//         await ctx.reply(`Nope, that’s not the 🧀!`);
//     }

//     // Edit the puzzle message
//     const updatedText = `Guess the 🧀:\n\n${renderPuzzle(puzzle)}`;
//     try {
//         await ctx.api.editMessageText(
//             puzzle.chatId,
//             puzzle.messageId,
//             updatedText
//         );
//     } catch (err) {
//         console.error("Error editing puzzle message:", err);
//     }

//     // If solved, you could remove it from the map or leave it in so that “solved = true”
//     if (puzzle.solved) {
//         // activePuzzles.delete(replyToMsgId);
//         // or just keep the record around so nobody else tries to guess
//     } else {
//         // Update the puzzle in the Map
//         activePuzzles.set(replyToMsgId, puzzle);
//     }
// })