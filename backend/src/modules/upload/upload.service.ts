import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { UploadApiResponse, v2 as CloudinaryClient } from 'cloudinary';
import { Readable } from 'stream';
import { CLOUDINARY } from './cloudinary.provider';

export interface UploadedImage {
  url: string;
  publicId: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UploadService {
  constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof CloudinaryClient) {}

  async uploadImage(
    file: Express.Multer.File,
    folder = 'burkha-by-malika/products',
  ): Promise<UploadedImage> {
    this.validateFile(file);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            return reject(error ?? new Error('Cloudinary upload failed'));
          }
          resolve(uploadResult);
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  async deleteImage(publicId: string): Promise<void> {
    await this.cloudinary.uploader.destroy(publicId);
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file was provided');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File exceeds the 5MB size limit');
    }
  }
}
