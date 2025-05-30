import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export function UploadInterceptor(fieldName: string, maxCount = 1): any {
  const interceptor =
    maxCount === 1
      ? FileInterceptor(fieldName, {
          storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
              const uniqueSuffix =
                Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = extname(file.originalname);
              cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
          }),
        })
      : FilesInterceptor(fieldName, maxCount, {
          storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
              const uniqueSuffix =
                Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = extname(file.originalname);
              cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
          }),
        });

  return UseInterceptors(interceptor);
}
