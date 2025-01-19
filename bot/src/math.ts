import { DateTime } from "luxon";
import { BaseCommandHandler, MyContext } from "./abstraction";
import { User } from "./database";
import { notInMain } from "./middleware";

interface MathProblem {
    question: string;
    answer: number;
}

function generateMultiOperation(): MathProblem {
    // Generate a problem with two operations
    const operations = ['+', '-', '*'];
    const op1 = operations[Math.floor(Math.random() * operations.length)];
    const op2 = operations[Math.floor(Math.random() * operations.length)];

    const num1 = Math.floor(Math.random() * 50) + 1;
    const num2 = Math.floor(Math.random() * 50) + 1;
    const num3 = Math.floor(Math.random() * 20) + 1;

    // Use parentheses randomly
    const useParens = Math.random() < 0.5;

    if (useParens) {
        const question = `(${num1} ${op1} ${num2}) ${op2} ${num3}`;
        let intermediateResult;
        switch (op1) {
            case '+': intermediateResult = num1 + num2; break;
            case '-': intermediateResult = num1 - num2; break;
            case '*': intermediateResult = num1 * num2; break;
            default: intermediateResult = num1 + num2;
        }

        let finalResult;
        switch (op2) {
            case '+': finalResult = intermediateResult + num3; break;
            case '-': finalResult = intermediateResult - num3; break;
            case '*': finalResult = intermediateResult * num3; break;
            default: finalResult = intermediateResult + num3;
        }

        return { question, answer: finalResult };
    } else {
        const question = `${num1} ${op1} ${num2} ${op2} ${num3}`;
        // Handle operator precedence
        let result;
        if ((op2 === '*' && (op1 === '+' || op1 === '-'))) {
            // Multiply first, then add/subtract
            const product = num2 * num3;
            result = op1 === '+' ? num1 + product : num1 - product;
        } else {
            // Evaluate left to right
            let intermediate;
            switch (op1) {
                case '+': intermediate = num1 + num2; break;
                case '-': intermediate = num1 - num2; break;
                case '*': intermediate = num1 * num2; break;
                default: intermediate = num1 + num2;
            }

            switch (op2) {
                case '+': result = intermediate + num3; break;
                case '-': result = intermediate - num3; break;
                case '*': result = intermediate * num3; break;
                default: result = intermediate + num3;
            }
        }
        return { question, answer: result };
    }
}

function generateDivision(): MathProblem {
    // Generate division problems that result in whole numbers
    const answer = Math.floor(Math.random() * 20) + 1;
    const multiplier = Math.floor(Math.random() * 10) + 1;
    const dividend = answer * multiplier;

    return {
        question: `${dividend} ÷ ${multiplier}`,
        answer: answer
    };
}

function generateMathProblem(): MathProblem {
    // 40% chance of multi-operation, 30% chance of division, 30% chance of simple operation
    const problemType = Math.random();

    if (problemType < 0.4) {
        return generateMultiOperation();
    } else if (problemType < 0.7) {
        return generateDivision();
    } else {
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        let num1: number, num2: number;

        switch (operation) {
            case '+':
                num1 = Math.floor(Math.random() * 100) + 1;
                num2 = Math.floor(Math.random() * 100) + 1;
                return {
                    question: `${num1} + ${num2}`,
                    answer: num1 + num2
                };
            case '-':
                num1 = Math.floor(Math.random() * 100) + 51;
                num2 = Math.floor(Math.random() * 50) + 1;
                return {
                    question: `${num1} - ${num2}`,
                    answer: num1 - num2
                };
            case '*':
                num1 = Math.floor(Math.random() * 20) + 1;
                num2 = Math.floor(Math.random() * 20) + 1;
                return {
                    question: `${num1} × ${num2}`,
                    answer: num1 * num2
                };
            default:
                return {
                    question: '1 + 1',
                    answer: 2
                };
        }
    }
}



export class MathCommand extends BaseCommandHandler {
    command = "math";
    description = "Solve a math problem in exchange for some cheese";
    middlewares = [notInMain]
    async handle(ctx: MyContext) {
        const userId = ctx.from?.id;
        if (!userId) return;

        const problem = generateMathProblem();
        const message = await ctx.reply(`Solve this problem for 10 cheese! 🧀\n${problem.question} = ?`, {
            reply_parameters: {
                message_id: ctx.message!.message_id
            }
        });

        // Store both the problem and the message ID
        const key = `${userId}:math`;
        ctx.map.set(key, {
            problem,
            messageId: message.message_id
        });
    }

    async handlePlainMessage(ctx: MyContext): Promise<void> {
        const userId = ctx.from?.id!;
        const mathKey = userId.toString() + ":math";

        console.log("Checking for math key", mathKey);

        const mathData = ctx.map.get(mathKey);
        if (!mathData || ctx.message?.reply_to_message?.message_id != mathData.messageId) {
            return;
        }

        const userAnswer = parseInt(ctx.message!.text!);
        if (isNaN(userAnswer)) {
            await ctx.reply("Please reply with a number! 🧀", {
                reply_to_message_id: ctx.message!.message_id
            });
            return;
        }

        if (userAnswer === mathData.problem.answer) {
            const userString = await ctx.db.get(userId.toString());
            let user: User = userString ? JSON.parse(userString) : {
                id: userId,
                name: ctx.from!.first_name,
                cheeseCount: 0,
                lastEaten: DateTime.now().toISO()
            };

            user.cheeseCount += 10;
            await ctx.db.set(userId.toString(), JSON.stringify(user));
            await ctx.reply("Correct! Here's 10 cheese! 🧀\nYou now have " + user.cheeseCount + " cheese!", {
                reply_to_message_id: ctx.message!.message_id
            });
        } else {
            await ctx.reply("Wrong answer! The correct answer was " + mathData.problem.answer + " 🧀", {
                reply_to_message_id: ctx.message!.message_id
            });
        }
        ctx.map.delete(mathKey);
    }
}

