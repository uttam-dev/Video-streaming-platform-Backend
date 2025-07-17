import fs from "fs";

import { v2 as cloudinary } from "cloudinary";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload an image
const uploadFileOnCloudanary = async function (localFilePath, dirName = "") {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            folder: `fullBackend/${dirName}`,
            public_id: Date.now(),
            resource_type: "auto",
        });
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.log(error);

        return null;
    }
};

const deleteFilesOnCloudanary = async (
    publicIds = [],
    resource_type = "image"
) => {
    try {
        const response = await cloudinary.api.delete_resources(publicIds, {
            resource_type,
        });
        if (response.deleted) {
            return response;
        } else {
            return null;
        }
    } catch (error) {
        console.log("Cloudinary error during delation assets : ", error);
    }
};
export { uploadFileOnCloudanary, deleteFilesOnCloudanary };
