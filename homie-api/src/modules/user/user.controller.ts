import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import * as userService from './user.service';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await userService.getProfile(req.userId!);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateProfile(req.userId!, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function getReputation(req: AuthRequest, res: Response, _next: NextFunction) {
  // Placeholder – reputation system not yet implemented
  res.json({
    userId: req.userId,
    score: null,
    totalReviews: 0,
    message: 'Reputation system coming soon',
  });
}

export async function updateHabits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const habits = await userService.updateHabits(req.userId!, req.body);
    res.json(habits);
  } catch (err) {
    next(err);
  }
}

export async function addPhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { url, position } = req.body;
    const photo = await userService.addPhoto(req.userId!, url, position);
    res.status(201).json(photo);
  } catch (err) {
    next(err);
  }
}

export async function deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await userService.deletePhoto(req.userId!, req.params.photoId as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function completeOnboarding(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await userService.completeOnboarding(req.userId!, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updatePushToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    const result = await userService.updatePushToken(req.userId!, token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await userService.getPublicProfile(req.params.id as string);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function discoverSeekers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { city, lat, lng, radius, page, limit } = req.query as any;

    const parsedLat = lat ? Number(lat) : undefined;
    const parsedLng = lng ? Number(lng) : undefined;
    const parsedRadius = radius ? Number(radius) : undefined;

    // Validate coordinates
    if (parsedLat !== undefined && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
      res.status(400).json({ message: 'Invalid latitude. Must be between -90 and 90.' });
      return;
    }
    if (parsedLng !== undefined && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
      res.status(400).json({ message: 'Invalid longitude. Must be between -180 and 180.' });
      return;
    }
    if (parsedRadius !== undefined && (isNaN(parsedRadius) || parsedRadius <= 0 || parsedRadius > 200)) {
      res.status(400).json({ message: 'Invalid radius. Must be between 1 and 200 km.' });
      return;
    }

    const result = await userService.discoverSeekers(req.userId!, {
      city,
      lat: parsedLat,
      lng: parsedLng,
      radius: parsedRadius,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
