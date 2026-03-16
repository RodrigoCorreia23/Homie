import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  city: z.string().min(1).max(100).optional(),
  preferredCity: z.string().min(1).max(100).optional(),
  role: z.enum(['SEEKER', 'LANDLORD', 'BOTH']).optional(),
});

export const updateHabitsSchema = z.object({
  schedule: z.enum(['DAY', 'NIGHT']),
  smoker: z.boolean(),
  pets: z.boolean(),
  cleanliness: z.number().int().min(1).max(5),
  noise: z.number().int().min(1).max(5),
  visitors: z.number().int().min(1).max(5),
  budgetMin: z.number().int().positive(),
  budgetMax: z.number().int().positive(),
});

export const onboardingSchema = z.object({
  role: z.enum(['SEEKER', 'LANDLORD', 'BOTH']),
  preferredCity: z.string().min(1).max(100).optional(),
  habits: z.object({
    schedule: z.enum(['DAY', 'NIGHT']),
    smoker: z.boolean(),
    pets: z.boolean(),
    cleanliness: z.number().int().min(1).max(5),
    noise: z.number().int().min(1).max(5),
    visitors: z.number().int().min(1).max(5),
    budgetMin: z.number().int().positive(),
    budgetMax: z.number().int().positive(),
  }).optional(),
});

export const addPhotoSchema = z.object({
  url: z.string().url(),
  position: z.number().int().min(0).max(5),
});
