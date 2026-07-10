import multer from 'multer';
import { ApiError } from '../utils/apiError.js';

const ALLOWED = /jpeg|jpg|png|webp|gif|pdf|mp4|mov|webm/;

/** In-memory upload — buffers are streamed to Cloudinary in controllers. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED.test(file.mimetype) || ALLOWED.test(file.originalname.toLowerCase());
    if (ok) return cb(null, true);
    cb(ApiError.badRequest('Unsupported file type'));
  },
});
