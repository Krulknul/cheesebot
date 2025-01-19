import { InputFile } from "grammy";
import { BaseCommandHandler, MyContext } from "./abstraction";
import sharp from "sharp";

/**
 * This function takes a photo buffer, a watermark file path,
 * and an option for watermark gravity ("southeast", "northeast", etc.),
 * then returns a processed Buffer with the watermark applied.
 */
export async function processImageWithWatermark(
    originalImageBuffer: ArrayBuffer,
    watermarkPath: string,
    botToken: string,
    gravity: "southeast" | "northeast" | "southwest" | "northwest" // or whichever you need
): Promise<Buffer> {
    // Get dimensions of input image
    const metadata = await sharp(Buffer.from(originalImageBuffer)).metadata();
    const width = metadata.width;
    const height = metadata.height;

    if (!width || !height) {
        throw new Error("Could not process image dimensions");
    }

    // Calculate watermark dimensions (1/3 or 1/2, whichever you prefer)
    const watermarkWidth = Math.round(width / 2);
    const watermarkHeight = Math.round(height / 2);

    // Create a resized version of the watermark
    const resizedWatermark = await sharp(watermarkPath)
        .resize(watermarkWidth, watermarkHeight, {
            fit: "inside",
            withoutEnlargement: false,
        })
        .toBuffer();

    // Process the image with the watermark
    const processedImageBuffer = await sharp(Buffer.from(originalImageBuffer))
        .composite([
            {
                input: resizedWatermark,
                gravity,
            },
        ])
        .toBuffer();

    return processedImageBuffer;
}


export class FingerCommand extends BaseCommandHandler {
    command = "finger"
    description = "Reply this to an image to show someone to f#ck off"
    async handle(ctx: MyContext): Promise<void> {
        // Check if command is a reply to a photo message
        const photo = ctx.message?.reply_to_message?.photo;
        if (!photo) {
            await ctx.reply("Please reply to a photo message with this command! 🧀");
            return;
        }

        try {
            // Get the largest version of the photo
            const photoFile = photo[photo.length - 1];
            // Download the photo
            const photoInfo = await ctx.api.getFile(photoFile.file_id);
            const photoUrl = `https://api.telegram.org/file/bot${ctx.environment.botToken}/${photoInfo.file_path}`;

            // Fetch the photo data
            const response = await fetch(photoUrl);
            const originalImageBuffer = await response.arrayBuffer();

            // Path to your watermark image
            const watermarkPath = "./finger.png";

            // Process the image (top-right corner)
            const processedImageBuffer = await processImageWithWatermark(
                originalImageBuffer,
                watermarkPath,
                ctx.environment.botToken,
                "southeast"
            );

            // Send the processed image
            await ctx.replyWithPhoto(new InputFile(processedImageBuffer, "output.jpg"), {
                reply_to_message_id: ctx.message?.message_id,
            });
        } catch (error) {
            console.error("Error processing image:", error);
            await ctx.reply("Sorry, there was an error processing the image 🧀");
        }

    }
}

export class LikeCommand extends BaseCommandHandler {
    command = "like"
    description = "Reply this to an image to show appreciation"
    async handle(ctx: MyContext): Promise<void> {
        // Check if command is a reply to a photo message
        const photo = ctx.message?.reply_to_message?.photo;
        if (!photo) {
            await ctx.reply("Please reply to a photo message with this command! 🧀");
            return;
        }

        try {
            // Get the largest version of the photo
            const photoFile = photo[photo.length - 1];
            // Download the photo
            const photoInfo = await ctx.api.getFile(photoFile.file_id);
            const photoUrl = `https://api.telegram.org/file/bot${ctx.environment.botToken}/${photoInfo.file_path}`;

            // Fetch the photo data
            const response = await fetch(photoUrl);
            const originalImageBuffer = await response.arrayBuffer();

            // Path to your watermark image
            const watermarkPath = "./like.png";

            // Process the image (bottom-right corner)
            const processedImageBuffer = await processImageWithWatermark(
                originalImageBuffer,
                watermarkPath,
                ctx.environment.botToken,
                "southeast"
            );

            // Send the processed image
            await ctx.replyWithPhoto(new InputFile(processedImageBuffer, "output.jpg"), {
                reply_to_message_id: ctx.message?.message_id,
            });
        } catch (error) {
            console.error("Error processing image:", error);
            await ctx.reply("Sorry, there was an error processing the image 🧀");
        }
    }
}

export class DislikeCommand extends BaseCommandHandler {
    command = "dislike"
    description = "Reply this to an image to show rejection"
    async handle(ctx: MyContext): Promise<void> {
        // Check if command is a reply to a photo message
        const photo = ctx.message?.reply_to_message?.photo;
        if (!photo) {
            await ctx.reply("Please reply to a photo message with this command! 🧀");
            return;
        }

        try {
            // Get the largest version of the photo
            const photoFile = photo[photo.length - 1];
            // Download the photo
            const photoInfo = await ctx.api.getFile(photoFile.file_id);
            const photoUrl = `https://api.telegram.org/file/bot${ctx.environment.botToken}/${photoInfo.file_path}`;

            // Fetch the photo data
            const response = await fetch(photoUrl);
            const originalImageBuffer = await response.arrayBuffer();

            // Path to your watermark image
            const watermarkPath = "./dislike.png";

            // Process the image (top-right corner)
            const processedImageBuffer = await processImageWithWatermark(
                originalImageBuffer,
                watermarkPath,
                ctx.environment.botToken,
                "northeast"
            );

            // Send the processed image
            await ctx.replyWithPhoto(new InputFile(processedImageBuffer, "output.jpg"), {
                reply_to_message_id: ctx.message?.message_id,
            });
        } catch (error) {
            console.error("Error processing image:", error);
            await ctx.reply("Sorry, there was an error processing the image 🧀");
        }
    }
}