import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import * as favoriteController from './favorite.controller';

const router = Router();

router.use(authenticate);

router.post('/', favoriteController.add);
router.delete('/:listingId', favoriteController.remove);
router.get('/', favoriteController.getAll);

export default router;
