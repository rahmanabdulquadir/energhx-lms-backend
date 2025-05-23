import { Request } from 'express';
import { TUser } from './token.type';

declare module 'express' {
  export interface Request {
    user: TUser;
  }
}