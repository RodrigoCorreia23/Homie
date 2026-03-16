import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { validateRequest, validateQuery } from '../../shared/middleware/validateRequest';
import {
  createListingSchema,
  updateListingSchema,
  listingFeedSchema,
  updateStatusSchema,
} from './listing.validation';
import * as listingController from './listing.controller';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createListingSchema), listingController.createListing);
router.get('/', validateQuery(listingFeedSchema), listingController.getListingFeed);
router.get('/map', listingController.getListingsForMap);
router.get('/mine', listingController.getMyListings);
router.get('/:id', listingController.getListingById);
router.put('/:id', validateRequest(updateListingSchema), listingController.updateListing);
router.delete('/:id', listingController.deleteListing);
router.patch('/:id/status', validateRequest(updateStatusSchema), listingController.updateStatus);
router.post('/:id/photos', listingController.addPhoto);
router.delete('/:id/photos/:photoId', listingController.deletePhoto);

export default router;
