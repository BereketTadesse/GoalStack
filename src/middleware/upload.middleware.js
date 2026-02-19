import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, "uploads/") },
    filename: (req, file, cb) => {
        // req.user._id is available because this runs after the 'protect' middleware
        const userId = req.user ? req.user._id : 'guest';
        const extension = path.extname(file.originalname);

        // Final name: userId-timestamp.extension (e.g., 65d2f-1712345.jpg)
        cb(null, `${userId}-${Date.now()}${extension}`);
    }
});

const allowedExtensions = /pdf|doc|docx|jpeg|jpg|png|gif/;
const allowedMimeTypes = /image\/(jpeg|jpg|png|gif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)/;

const fileFilter = (req, file, cb) => {
    const isExtValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const isMimeTypeValid = allowedMimeTypes.test(file.mimetype);
    if (isExtValid && isMimeTypeValid) {
        cb(null, true);
    } else {
        cb(new Error("Only images (jpg, png, gif) and documents (pdf, doc, docx) are allowed!"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export default upload;