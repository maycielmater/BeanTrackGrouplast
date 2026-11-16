import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("public/uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(allowed.includes(file.mimetype) ? null : new Error("Only JPG, PNG, and WEBP images are allowed."), allowed.includes(file.mimetype));
  }
});
export default upload;