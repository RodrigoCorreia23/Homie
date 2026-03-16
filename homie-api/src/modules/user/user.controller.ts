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
