import multer from "multer"
import path from "path"
const stroage = multer.diskStorage({
    destination:(req,file,cb)=>{cb(null,"uploads/")},
    filename: (req, file, cb) => {
            // req.user._id is available because this runs after the 'protect' middleware
            const userId = req.user ? req.user._id : 'guest';
            const extension = path.extname(file.originalname);
            
            // Final name: userId-timestamp.extension (e.g., 65d2f-1712345.jpg)
            cb(null, `${userId}-${Date.now()}${extension}`);
        }

});

const fileFileter=(req,file,cb)=>{
    const allowedTypes=/pdf|doc|docx|jpeg|jpg|png|gif/;
    const isExtvalid= allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isMimeTypeValid = allowedTypes.test(file.mimetype);
    if(isExtvalid && isMimeTypeValid){
        cb(null,true);
    }else{
        cb(new Error("Only image files are allowed!"),false);
    }
};

const upload = multer({

    storage:stroage,
    fileFilter:fileFileter,
    limits:{fileSize:5*1024*1024} // 5MB limit
});

export default upload;