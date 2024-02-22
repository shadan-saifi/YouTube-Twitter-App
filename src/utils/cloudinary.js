import { v2 as cloudinary, } from 'cloudinary';

import fs from "fs"
import { ApiError } from './ApiError.js';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log("local file path",localFilePath);
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            media_metadata:true
        })
        console.log("file uploaded on cloudinary successfully, response:", response.url);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        throw new ApiError(500,error.message)
    }
}


const deleteFromCloudinary = async (publicId, resource_type) => {
    try {
        if (!publicId) {
            return null
        }
        const response = cloudinary.api.delete_resources([publicId],
            { type: "upload", invalidate: true, resource_type: resource_type })


        return response
    } catch (error) {
        throw new ApiError(400, error.message)
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }