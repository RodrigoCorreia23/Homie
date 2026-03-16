import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import * as uploadService from './upload.service';

export async function uploadImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { image, folder } = req.body;
    const result = await uploadService.uploadImage(image, folder || 'homie');
    res.json(result);
  } catch (err) {
    next(err);
  }
}
