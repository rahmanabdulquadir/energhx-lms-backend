import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import * as mime from 'mime-types';

@Injectable()
export class LibService {
  private readonly logger = new Logger(LibService.name);
  private getResourceType(path: string): 'image' | 'video' | 'raw' {
    const mimeType = mime.lookup(path) || '';
    const extension = path.split('.').pop()?.toLowerCase();
    if (mimeType.startsWith('image/')) return 'image';
    if (
      mimeType.startsWith('video/') ||
      ['mp4', 'mov', 'avi', 'mkv'].includes(extension || '')
    ) {
      return 'video';
    }

    return 'raw';
  }

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
    });
  }

  public hashPassword({
    password,
    round = 6,
  }: {
    password: string;
    round?: number;
  }): Promise<string> {
    return bcrypt.hash(password, round);
  }

  public comparePassword({
    hashedPassword,
    password,
  }: {
    password: string;
    hashedPassword: string;
  }): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  public async uploadToCloudinary({
    fileName,
    path,
  }: {
    fileName: string;
    path: string;
  }): Promise<UploadApiResponse> {
    const resourceType = this.getResourceType(path);
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        path,
        { public_id: fileName, resource_type: resourceType },
        (error, result) => {
          fs.unlink(path, (err) => {
            if (err) this.logger.error(`Error deleting local file: ${err}`);
            else this.logger.log('Local file deleted successfully.');
          });

          if (error) return reject(error as UploadApiErrorResponse);
          resolve(result as UploadApiResponse);
        },
      );
    });
  }
}
