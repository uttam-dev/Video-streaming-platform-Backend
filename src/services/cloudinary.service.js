import fs from "fs";

import { v2 as cloudinary } from "cloudinary";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload an image
const uploadFileOnCloudanary = async function (localFilePath) {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath);

        console.log("File uploaded on cloudinary .. ", response);

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};

export { uploadFileOnCloudanary };
