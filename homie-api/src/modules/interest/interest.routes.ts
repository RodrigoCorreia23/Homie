import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { validateRequest } from '../../shared/middleware/validateRequest';
import { sendInterestSchema } from './interest.validation';
import * as interestController from './interest.controller';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(sendInterestSchema), interestController.sendInterest);
router.get('/sent', interestController.getSent);
router.get('/received', interestController.getReceived);
router.patch('/:id/accept', interestController.accept);
router.patch('/:id/reject', interestController.reject);

export default router;
