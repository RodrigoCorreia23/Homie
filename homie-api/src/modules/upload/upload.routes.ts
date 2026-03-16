import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import * as uploadController from './upload.controller';

const router = Router();

router.use(authenticate);

router.post('/', uploadController.uploadImage);

export default router;
