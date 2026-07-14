import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { uploadBuffer } from '../config/cloudinary.js';

// POST /api/media  (multipart, field: file) -> { url, publicId }
export const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');
  const result = await uploadBuffer(req.file.buffer, 'influconnect/uploads', 'auto', req.file.mimetype);
  res.status(201).json({ success: true, ...result, name: req.file.originalname });
});

// POST /api/media/multiple (multipart, field: files[]) -> { files: [...] }
export const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('No files provided');
  const files = await Promise.all(
    req.files.map(async (f) => ({
      ...(await uploadBuffer(f.buffer, 'influconnect/uploads', 'auto', f.mimetype)),
      name: f.originalname,
    }))
  );
  res.status(201).json({ success: true, files });
});
