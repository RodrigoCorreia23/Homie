import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import * as notificationController from './notification.controller';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getAll);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.get('/unread-count', notificationController.getUnreadCount);

export default router;
