import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { ErrorEnum } from "../enums/errorEnum";

// Configuration de Multer pour stocker les fichiers
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const uploadDir = process.env.FILES_UPLOAD_OUTPUT || "uploads";

        if (!process.env.FILES_UPLOAD_OUTPUT) {
            console.log("[WARNING] La variable FILES_UPLOAD_OUTPUT n'est pas configurée. Par défaut, les fichiers téléchargés seront placés dans le dossier /uploads.")   
        }
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Filtre de validation des fichiers
const createFileFilter = (allowedMimeTypes: string[]) => (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(ErrorEnum.UNAUTHORIZED_MIME_TYPE), false);
    }
};

export const uploadFiles = (
    files: Express.Multer.File[],
    allowedMimeTypes: string[]
): Promise<{ filesUploaded: string[], rejectedFiles: string[] }> => {
    return new Promise((resolve, reject) => {
        try {
            const fileFilter = createFileFilter(allowedMimeTypes);

            const filesUploaded: string[] = [];
            const rejectedFiles: string[] = [];

            const filePromises = files.map(file => {
                return new Promise<void>((res) => {
                    fileFilter(null as unknown as Request, file, (err) => {
                        if (err) {
                            rejectedFiles.push(file.originalname); // Ajoute aux fichiers rejetés
                        } else {
                            filesUploaded.push(file.path); // Ajoute aux fichiers acceptés
                        }
                        res();
                    });
                });
            });

            Promise.all(filePromises).then(() => {
                resolve({ filesUploaded, rejectedFiles });
            }).catch(reject);
        } catch (error) {
            reject(error);
        }
    });
};

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }
}).array("pictures", 10);

export const deleteFile = async (filePath: string): Promise<void> => {
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log(`Fichier supprimé : ${filePath}`);
        } else {
            console.warn(`Fichier introuvable : ${filePath}`);
        }
    } catch (error) {
        console.error(`Erreur lors de la suppression du fichier : ${filePath}`, error);
        throw new Error(ErrorEnum.FILE_DELETE_ERROR);
    }
};

export default upload;