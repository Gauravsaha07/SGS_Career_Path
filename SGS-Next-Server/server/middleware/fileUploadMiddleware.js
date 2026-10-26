import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {

        const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'jpg'
        const fileName = crypto.randomUUID() + "." + ext

        cb(null, fileName )
    }
})

const upload = multer({ storage })

export default upload
