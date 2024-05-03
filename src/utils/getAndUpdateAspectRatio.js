import sharp from "sharp";
import { ApiError } from "./ApiError.js";

async function getAndUpdateAspectRatio(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();
        const width = metadata.width;
        const height = metadata.height;
        const aspectRatio = width / height;

        if (Math.abs(aspectRatio - 16 / 9) < 0.01) {
            return filePath; // Aspect ratio is already 16:9
        } else {
            const newHeight = Math.round(width / (16 / 9));
            const resizedImageBuffer = await sharp(filePath).resize({ width: width, height: newHeight }).toBuffer();
            const newPath = filePath.replace('.jpg', '_resized.jpg'); // Generate new file path

            // Write the resized image to a new file
            await sharp(resizedImageBuffer).toFile(newPath);

            return newPath; // Return the path to the resized image
        }
    } catch (error) {
        console.log(error.message, "Error updating thumbnail aspect ratio");
        throw new ApiError(500, error.message || "Error updating thumbnail aspect ratio");
    }
}

export default getAndUpdateAspectRatio;
