import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { updateProfileSchema, updateHabitsSchema, addPhotoSchema } from './user.validation';
import * as userController from './user.controller';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.put('/me', validateRequest(updateProfileSchema), userController.updateMe);
router.put('/me/habits', validateRequest(updateHabitsSchema), userController.updateHabits);
router.post('/me/photos', validateRequest(addPhotoSchema), userController.addPhoto);
router.delete('/me/photos/:photoId', userController.deletePhoto);
router.get('/:id', userController.getUser);

export default router;
