import multer from "multer";
import path from "path";
import fs from "fs";

// Configuration de Multer pour stocker les fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.IMAGES_PATH || "uploads/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Renommer le fichier avec un timestamp
    }
});

const upload = multer({ storage }).array("pictures", 10); // Accepter jusqu'à 10 fichiers

export const uploadFiles = (files: Express.Multer.File[]): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        try {
            const filePaths = files.map(file => file.path);
            resolve(filePaths);
        } catch (error) {
            reject(error);
        }
    });
};

export default upload;
