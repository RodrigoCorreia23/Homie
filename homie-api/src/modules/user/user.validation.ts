import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  city: z.string().min(1).max(100).optional(),
  preferredCity: z.string().min(1).max(100).optional(),
  role: z.enum(['SEEKER', 'LANDLORD', 'BOTH']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
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

const habitsSchema = z.object({
  schedule: z.enum(['DAY', 'NIGHT']),
  smoker: z.boolean(),
  pets: z.boolean(),
  cleanliness: z.number().int().min(1).max(5),
  noise: z.number().int().min(1).max(5),
  visitors: z.number().int().min(1).max(5),
  budgetMin: z.number().int().min(0),
  budgetMax: z.number().int().min(0),
});

const houseRulesSchema = z.object({
  smokingPolicy: z.enum(['NOT_ALLOWED', 'OUTSIDE_ONLY', 'ALLOWED']),
  petsPolicy: z.enum(['NOT_ALLOWED', 'SMALL_ONLY', 'ALLOWED']),
  partiesPolicy: z.enum(['NOT_ALLOWED', 'OCCASIONAL', 'ALLOWED']),
  overnightGuests: z.enum(['NOT_ALLOWED', 'WITH_NOTICE', 'ALLOWED']),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  cleanlinessLevel: z.number().int().min(1).max(5),
  preferredGender: z.enum(['MALE', 'FEMALE', 'ANY']).optional(),
  maxOccupants: z.number().int().min(1).optional(),
});

export const onboardingSchema = z.object({
  role: z.enum(['SEEKER', 'LANDLORD', 'BOTH']),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  preferredCity: z.string().min(1).max(100).optional(),
  preferredCities: z.array(z.string().min(1).max(100)).max(5).optional(),
  habits: habitsSchema.optional(),
  houseRules: houseRulesSchema.optional(),
});

export const addPhotoSchema = z.object({
  url: z.string().url(),
  position: z.number().int().min(0).max(5),
});
