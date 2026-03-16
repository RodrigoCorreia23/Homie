import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from './auth.middleware';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { signupSchema, loginSchema, refreshSchema } from './auth.validation';

const router = Router();

router.post('/signup', validateRequest(signupSchema), authController.signup);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;
