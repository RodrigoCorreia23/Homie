import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import * as listingService from './listing.service';
import * as boostService from './boost.service';

export async function createListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const listing = await listingService.createListing(req.userId!, req.body);
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
}

export async function getListingFeed(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await listingService.getListingFeed(req.userId!, (req as any).validatedQuery || req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getListingsForMap(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { lat, lng, radius } = req.query as any;
    const listings = await listingService.getListingsForMap(
      Number(lat),
      Number(lng),
      Number(radius),
    );
    res.json(listings);
  } catch (err) {
    next(err);
  }
}

export async function getMyListings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const listings = await listingService.getMyListings(req.userId!);
    res.json(listings);
  } catch (err) {
    next(err);
  }
}

export async function getListingById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const listing = await listingService.getListingById(req.params.id as string, req.userId);
    res.json(listing);
  } catch (err) {
    next(err);
  }
}

export async function updateListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const listing = await listingService.updateListing(req.params.id as string, req.userId!, req.body);
    res.json(listing);
  } catch (err) {
    next(err);
  }
}

export async function deleteListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await listingService.deleteListing(req.params.id as string, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const listing = await listingService.updateStatus(req.params.id as string, req.userId!, req.body.status);
    res.json(listing);
  } catch (err) {
    next(err);
  }
}

export async function addPhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { url, position } = req.body;
    const photo = await listingService.addListingPhoto(req.params.id as string, req.userId!, url, position);
    res.status(201).json(photo);
  } catch (err) {
    next(err);
  }
}

export async function deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await listingService.deleteListingPhoto(
      req.params.id as string,
      req.userId!,
      req.params.photoId as string,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ─── Boost ───────────────────────────────────────────────

export async function getBoostTiers(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tiers = await boostService.getBoostTiers();
    res.json(tiers);
  } catch (err) {
    next(err);
  }
}

export async function createBoost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { tier } = req.body;
    const result = await boostService.createBoostPayment(
      req.userId!,
      req.params.id as string,
      tier,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function confirmBoost(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { paymentIntentId } = req.body;
    const listing = await boostService.activateBoost(paymentIntentId);
    res.json(listing);
  } catch (err) {
    next(err);
  }
}
