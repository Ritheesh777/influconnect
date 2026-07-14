import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env.js';
import { ApiError } from '../utils/apiError.js';

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

// Largest file we'll inline as a data URI when Cloudinary isn't configured.
// (Mongo documents cap at 16MB; base64 inflates size ~33%.)
const MAX_INLINE_BYTES = 3 * 1024 * 1024; // 3 MB

/**
 * Uploads a file buffer and returns a usable URL.
 *
 * With Cloudinary keys → a real CDN URL.
 * Without keys → a COMPLETE base64 data URI, so images genuinely render.
 * (This previously returned a truncated string, which produced broken images
 * everywhere — that was the "photos not loading" bug.)
 */
export async function uploadBuffer(buffer, folder = 'influconnect', resourceType = 'auto', mimetype) {
  if (!isCloudinaryConfigured()) {
    if (buffer.length > MAX_INLINE_BYTES) {
      throw ApiError.badRequest(
        'File is too large (max 3MB until Cloudinary storage is connected). Please upload a smaller file.'
      );
    }
    const type = mimetype || 'application/octet-stream';
    return {
      url: `data:${type};base64,${buffer.toString('base64')}`,
      publicId: null,
      placeholder: true,
    };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id, placeholder: false });
      }
    );
    stream.end(buffer);
  });
}

export { cloudinary };
