import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import dotenv from 'dotenv';
dotenv.config(); 

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath){
            return null; 
        }
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        })
        // console.log(response)
        //file upload successfull
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        console.error("Cloudinary upload error:", error.message);
        fs.unlinkSync(localFilePath) // remove the locally saved temp file as upload operation got failed
    }
}

const deleteFromCloudinary = async(url , resourceType = 'image') =>{
    try {

        if(!url){
            return;
        }

        const parts = url.split("/")
        const fileWithExt = parts[parts.length  - 1]
        const publicId = fileWithExt.split(".")[0]

        const folderParts = parts.slice(parts.indexOf("upload") + 1, parts.length - 1)
        const folderPath = folderParts.join("/")
        const fullPublicId = folderPath ? `${folderPath}/${publicId}` : publicId

        await cloudinary.uploader.destroy(fullPublicId, { resource_type: resourceType })

    } catch (error) {
        console.error(`Cloudinary delete error [${resourceType}]:`, error.message);
    }
}


export {uploadOnCloudinary , deleteFromCloudinary }


