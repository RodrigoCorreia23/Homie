import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/types';
import * as favoriteService from './favorite.service';

export async function add(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { listingId } = req.body;
    const favorite = await favoriteService.addFavorite(req.userId!, listingId);
    res.status(201).json(favorite);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await favoriteService.removeFavorite(req.userId!, req.params.listingId as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const favorites = await favoriteService.getFavorites(req.userId!);
    res.json(favorites);
  } catch (err) {
    next(err);
  }
}
