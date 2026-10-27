import fs from "node:fs";
import multer from "multer";
import crypto from "crypto";


fs.mkdirSync("uploads", { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'jpg';
        const fileName = crypto.randomUUID() + "." + ext;
        cb(null, fileName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type! Only JPG, PNG, and WebP images are allowed."), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, 
    fileFilter
});

export default upload;
