import { z } from 'zod';

export const createListingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  type: z.enum(['ROOM', 'APARTMENT', 'COLIVING']),
  pricePerMonth: z.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1).max(300),
  city: z.string().min(1).max(100),
  bedrooms: z.number().int().positive(),
  bathrooms: z.number().int().positive(),
  furnished: z.boolean(),
  billsIncluded: z.boolean(),
  availableFrom: z.string().datetime(),
  smokersAllowed: z.boolean(),
  petsAllowed: z.boolean(),
  preferredGender: z.enum(['MALE', 'FEMALE', 'ANY']).optional(),
});

export const updateListingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  type: z.enum(['ROOM', 'APARTMENT', 'COLIVING']).optional(),
  pricePerMonth: z.number().int().positive().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().min(1).max(300).optional(),
  city: z.string().min(1).max(100).optional(),
  bedrooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  furnished: z.boolean().optional(),
  billsIncluded: z.boolean().optional(),
  availableFrom: z.string().datetime().optional(),
  smokersAllowed: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  preferredGender: z.enum(['MALE', 'FEMALE', 'ANY']).optional(),
});

export const listingFeedSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  city: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().optional(),
  type: z.enum(['ROOM', 'APARTMENT', 'COLIVING']).optional(),
  minPrice: z.coerce.number().int().positive().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  furnished: z.coerce.boolean().optional(),
  billsIncluded: z.coerce.boolean().optional(),
  petsAllowed: z.coerce.boolean().optional(),
  smokersAllowed: z.coerce.boolean().optional(),
  bedrooms: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['price', 'compatibility', 'date', 'distance']).optional().default('date'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'RENTED']),
});
