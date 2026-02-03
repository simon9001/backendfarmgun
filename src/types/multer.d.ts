import { IncomingMessage } from 'http';

declare global {
  namespace Express {
    interface Request {
      file?: Multer.File;
      files?: Multer.File[];
    }
  }
}

declare module 'multer' {
  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }
}