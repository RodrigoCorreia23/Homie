import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import * as chatController from './chat.controller';

const router = Router();

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);
router.patch('/conversations/:id/read', chatController.markAsRead);

export default router;
