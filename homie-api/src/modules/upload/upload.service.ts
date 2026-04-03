import { env } from '../../config/env';
import { AppError } from '../../shared/middleware/errorHandler';

export async function uploadImage(base64Image: string, folder: string) {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new AppError('Image upload not configured', 503);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: base64Image,
        upload_preset: 'homie_unsigned',
        folder,
      }),
    },
  );

  if (!response.ok) {
    throw new AppError('Failed to upload image', 500);
  }

  const data = (await response.json()) as { secure_url: string; public_id: string };
  return { url: data.secure_url, publicId: data.public_id };
}
