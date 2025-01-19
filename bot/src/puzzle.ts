import { Bot } from "grammy";
import { allEmojis } from "./emoji";
import { BaseCommandHandler, MyContext } from "./abstraction";
import { adminOnly } from "./middleware";
import { User } from "./database";
import { DateTime } from "luxon";

interface EmojiPuzzle {
    chatId: number;
    puzzle: string[];
    prizeIndex: number;
    revealed: boolean[];
    solved: boolean;
    messageId: number; // so we can store the posted puzzle's message ID
}

const activePuzzles = new Map<number, EmojiPuzzle>();

/**
 * Returns an array of N*N random emojis from `allEmojis`. in utf8
 */
function getRandomEmojis(n: number): string[] {
    const emojis = [];
    for (let i = 0; i < n * n; i++) {
        emojis.push(allEmojis[Math.floor(Math.random() * allEmojis.length)]);
    }
    return emojis;
}

async function postEmojiPuzzle(
    ctx: MyContext,
    chatId: number,
    n = 5 // size of the grid
): Promise<void> {
    // 1. Build the grid
    const puzzle = getRandomEmojis(n);
    // 2. Choose random position for the 🧀
    const prizeIndex = Math.floor(Math.random() * puzzle.length);

    // 3. Format for message text
    let puzzleText = "";
    for (let i = 0; i < puzzle.length; i++) {
        puzzleText += puzzle[i];
        if ((i + 1) % n === 0) puzzleText += "\n"; // newline after every N
    }

    // 4. Post the puzzle
    const message = await ctx.api.sendMessage(chatId, `Guess the 🧀:\n\n${puzzleText}`);

    // 5. Store puzzle data in `activePuzzles`
    activePuzzles.set(message.message_id, {
        chatId,
        puzzle,
        prizeIndex,
        revealed: Array(puzzle.length).fill(false),
        solved: false,
        messageId: message.message_id,
    });
}

function renderPuzzle(puzzle: EmojiPuzzle): string {
    const n = Math.sqrt(puzzle.puzzle.length);
    let result = "";
    for (let i = 0; i < puzzle.puzzle.length; i++) {
        if (puzzle.revealed[i]) {
            // revealed emoji is either 🧀 (if i == prizeIndex) or ❌
            result += (i === puzzle.prizeIndex) ? "🧀" : "❌";
        } else {
            result += puzzle.puzzle[i];
        }
        if ((i + 1) % n === 0) result += "\n";
    }
    return result;
}

export async function onPuzzle(ctx: MyContext) {
    if (!ctx.chat) return; // Safety check

    // You can choose a grid size (N×N). For example, 5×5:
    const gridSize = 5;

    // Call your existing function to post and track the puzzle
    await postEmojiPuzzle(ctx, ctx.chat.id, gridSize);

    // Optional: Acknowledge or confirm the puzzle has started
    await ctx.reply(
        `A new ${gridSize}×${gridSize} emoji puzzle has been posted! Reply to it with an emoji to guess where the 🧀 is!`
    );
}

export class EmojiPuzzleCommand extends BaseCommandHandler {
    command = "puzzle";
    addToList = false;
    middlewares = [adminOnly];

    async handle(ctx: MyContext) {
        await onPuzzle(ctx);
    }

    async handlePlainMessage(ctx: MyContext): Promise<void> {
        const replyToMsgId = ctx.message?.reply_to_message?.message_id;
        if (!replyToMsgId) return; // Not a reply

        // Is this a reply to an active puzzle?
        const puzzle = activePuzzles.get(replyToMsgId);
        if (!puzzle) return;

        // If puzzle is already solved, ignore further guesses
        if (puzzle.solved) {
            await ctx.reply("That puzzle was already solved! 🧀");
            return;
        }

        const guessEmoji = ctx.message!.text!.trim();
        const index = puzzle.puzzle.indexOf(guessEmoji);

        // If guessed emoji isn't in the puzzle
        if (index === -1) {
            await ctx.reply("That emoji is not in the puzzle. Try again! 🧀");
            return;
        }

        // Mark revealed
        puzzle.revealed[index] = true;

        // Check if correct
        if (index === puzzle.prizeIndex) {
            puzzle.solved = true;
            // OPTIONAL: award cheese to the user
            try {
                const userId = ctx.from?.id;
                if (userId) {
                    const userString = await ctx.db.get(userId.toString());
                    let user: User = userString
                        ? JSON.parse(userString)
                        : {
                            id: userId,
                            name: ctx.from?.first_name ?? "Someone",
                            cheeseCount: 0,
                            lastEaten: DateTime.now().toISO(),
                        };
                    user.cheeseCount += 100; // your reward amount
                    await ctx.db.set(userId.toString(), JSON.stringify(user));

                    await ctx.reply(
                        `Correct! ${ctx.from?.first_name} found the 🧀!\nYou earned 100 cheese.\nYour new balance: ${user.cheeseCount} 🧀`
                    );
                }
            } catch (err) {
                console.error("Error awarding cheese:", err);
            }
        } else {
            // Wrong guess
            await ctx.reply(`Nope, that’s not the 🧀!`);
        }

        // --- NEW LOGIC: Delete old puzzle message and send updated puzzle as a new message ---
        const updatedText = `Guess the 🧀:\n\n${renderPuzzle(puzzle)}`;

        // 1. Remove the old puzzle message
        try {
            await ctx.api.deleteMessage(puzzle.chatId, puzzle.messageId);
        } catch (err) {
            console.error("Error deleting puzzle message:", err);
        }

        // 2. Send a new message with the updated puzzle
        const newMessage = await ctx.reply(updatedText);

        // 3. Update puzzle.messageId
        puzzle.messageId = newMessage.message_id;

        // 4. Remove the old puzzle entry and re-add it under the new message ID
        activePuzzles.delete(replyToMsgId);

        // If you still want to keep track of it (e.g., so more guesses can happen if not solved),
        // set it under the new message ID. If puzzle is solved, you might *not* re-add it.
        if (!puzzle.solved) {
            activePuzzles.set(newMessage.message_id, puzzle);
        }
    }
}