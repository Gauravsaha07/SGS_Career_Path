import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs"

// Configuration
cloudinary.config({
  cloud_name: 'jnqieu8s',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadToCloudinary = async (fileLink) => {

  // Upload an image

  const uploadResult = await cloudinary.uploader
    .upload(
      fileLink, {
      resource_type: "auto"
    }
    )
    .catch((error) => {
      console.log(error);
      // If failes remove file from our server
      fs.unlinkSync(fileLink)
    });
  return uploadResult
}

export default uploadToCloudinary
