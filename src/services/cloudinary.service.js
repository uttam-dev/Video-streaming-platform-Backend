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
        const response = await cloudinary.uploader.upload(localFilePath, {
            asset_folder: "fullBackend",
        });
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};



const deleteFilesOnCloudanary = async (publicIds = [])=>{
    try{
        const response = await cloudinary.api.delete_resources(publicIds)
        if(response.deleted)
        {
            return response
        }else{
            return null
        }
    }
    catch(error){
        console.log("Cloudinary error during delation assets : ",error);
    }
}
export { uploadFileOnCloudanary,deleteFilesOnCloudanary };
