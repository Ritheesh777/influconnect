import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env.js';

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

/**
 * Uploads a file buffer to Cloudinary. Falls back to a data-URI string when
 * Cloudinary is not yet configured, so uploads still "work" in local dev
 * before real API keys are supplied.
 */
export async function uploadBuffer(buffer, folder = 'influconnect', resourceType = 'auto') {
  if (!isCloudinaryConfigured()) {
    return {
      url: `data:application/octet-stream;base64,${buffer.toString('base64').slice(0, 64)}...`,
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
