import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { updateProfileSchema, updateHabitsSchema, addPhotoSchema, onboardingSchema } from './user.validation';
import * as userController from './user.controller';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.put('/me', validateRequest(updateProfileSchema), userController.updateMe);
router.post('/me/onboarding', validateRequest(onboardingSchema), userController.completeOnboarding);
router.put('/me/habits', validateRequest(updateHabitsSchema), userController.updateHabits);
router.post('/me/photos', validateRequest(addPhotoSchema), userController.addPhoto);
router.delete('/me/photos/:photoId', userController.deletePhoto);
router.put('/me/push-token', userController.updatePushToken);
router.get('/seekers', userController.discoverSeekers);
router.get('/:id', userController.getUser);

export default router;
