import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";

let isConfigured = false;

const configureCloudinary = () => {
  if (isConfigured) return;

  // Prefer CLOUDINARY_URL if present, otherwise fallback to separate credentials
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL
    });
  } else if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  isConfigured = true;
};

const uploadToCloudinary = async (fileLink) => {
  configureCloudinary();

  try {
    const uploadResult = await cloudinary.uploader.upload(fileLink, {
      resource_type: "auto",
      folder: "careerbridge_avatars"
    });
    return uploadResult;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message || error);
    throw error;
  } finally {
    if (fileLink && fs.existsSync(fileLink)) {
      try {
        fs.unlinkSync(fileLink);
      } catch (err) {
        // silent cleanup failure
      }
    }
  }
};

export default uploadToCloudinary;
