import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/errorHandler';
import { haversineDistance, boundingBox } from '../../shared/utils/geo';
import { calculateCompatibility } from '../../shared/utils/scoring';

interface CreateListingData {
  title: string;
  description: string;
  type: 'ROOM' | 'APARTMENT' | 'COLIVING';
  pricePerMonth: number;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  billsIncluded: boolean;
  availableFrom: string;
  smokersAllowed: boolean;
  petsAllowed: boolean;
  preferredGender?: 'MALE' | 'FEMALE' | 'ANY';
}

interface ListingFeedFilters {
  page: number;
  limit: number;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  type?: 'ROOM' | 'APARTMENT' | 'COLIVING';
  minPrice?: number;
  maxPrice?: number;
  furnished?: boolean;
  billsIncluded?: boolean;
  petsAllowed?: boolean;
  smokersAllowed?: boolean;
  bedrooms?: number;
  sortBy: 'price' | 'compatibility' | 'date' | 'distance';
}

export async function createListing(ownerId: string, data: CreateListingData) {
  const listing = await prisma.listing.create({
    data: {
      ownerId,
      ...data,
      availableFrom: new Date(data.availableFrom),
    },
    include: {
      photos: { orderBy: { position: 'asc' } },
    },
  });

  return listing;
}

export async function getListingFeed(userId: string, filters: ListingFeedFilters) {
  const { page, limit, sortBy } = filters;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    status: 'ACTIVE',
  };

  if (filters.city) where.city = filters.city;
  if (filters.type) where.type = filters.type;
  if (filters.furnished !== undefined) where.furnished = filters.furnished;
  if (filters.billsIncluded !== undefined) where.billsIncluded = filters.billsIncluded;
  if (filters.petsAllowed !== undefined) where.petsAllowed = filters.petsAllowed;
  if (filters.smokersAllowed !== undefined) where.smokersAllowed = filters.smokersAllowed;
  if (filters.bedrooms) where.bedrooms = filters.bedrooms;

  if (filters.minPrice || filters.maxPrice) {
    where.pricePerMonth = {};
    if (filters.minPrice) where.pricePerMonth.gte = filters.minPrice;
    if (filters.maxPrice) where.pricePerMonth.lte = filters.maxPrice;
  }

  // Geo bounding box filter
  if (filters.lat !== undefined && filters.lng !== undefined && filters.radius) {
    const box = boundingBox(filters.lat, filters.lng, filters.radius);
    where.latitude = { gte: box.minLat, lte: box.maxLat };
    where.longitude = { gte: box.minLng, lte: box.maxLng };
  }

  // Determine ordering for DB query
  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'price') orderBy = { pricePerMonth: 'asc' };

  // Fetch listings
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        photos: { orderBy: { position: 'asc' } },
        owner: {
          select: {
            id: true,
            name: true,
            photos: { orderBy: { position: 'asc' }, take: 1 },
            habits: true,
          },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  // Get seeker habits for compatibility calculation
  const seekerHabits = await prisma.habits.findUnique({
    where: { userId },
  });

  // Enrich listings with compatibility and distance
  let enriched = listings.map((listing) => {
    let compatibility: number | null = null;
    let distance: number | null = null;

    // Calculate compatibility if seeker has habits and owner has habits
    if (seekerHabits && listing.owner.habits) {
      compatibility = calculateCompatibility(
        seekerHabits as any,
        listing.owner.habits as any,
        {
          smokersAllowed: listing.smokersAllowed,
          petsAllowed: listing.petsAllowed,
          pricePerMonth: listing.pricePerMonth,
        },
      );
    }

    // Calculate distance if coordinates provided
    if (filters.lat !== undefined && filters.lng !== undefined) {
      distance = Math.round(
        haversineDistance(filters.lat, filters.lng, listing.latitude, listing.longitude) * 10,
      ) / 10;
    }

    // Filter by exact haversine distance (bounding box is approximate)
    if (
      filters.lat !== undefined &&
      filters.lng !== undefined &&
      filters.radius &&
      distance !== null &&
      distance > filters.radius
    ) {
      return null;
    }

    return {
      ...listing,
      compatibility,
      distance,
    };
  }).filter(Boolean);

  // Sort by compatibility or distance (can't do these in DB)
  if (sortBy === 'compatibility') {
    enriched.sort((a, b) => (b!.compatibility ?? 0) - (a!.compatibility ?? 0));
  } else if (sortBy === 'distance') {
    enriched.sort((a, b) => (a!.distance ?? Infinity) - (b!.distance ?? Infinity));
  }

  return {
    listings: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getListingsForMap(lat: number, lng: number, radius: number) {
  const box = boundingBox(lat, lng, radius);

  const listings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      pricePerMonth: true,
      type: true,
      title: true,
      photos: { orderBy: { position: 'asc' }, take: 1 },
    },
  });

  return listings;
}

export async function getMyListings(ownerId: string) {
  const listings = await prisma.listing.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    include: {
      photos: { orderBy: { position: 'asc' } },
      _count: {
        select: { interests: true },
      },
    },
  });

  return listings;
}

export async function getListingById(listingId: string, userId?: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      photos: { orderBy: { position: 'asc' } },
      owner: {
        select: {
          id: true,
          name: true,
          bio: true,
          city: true,
          createdAt: true,
          photos: { orderBy: { position: 'asc' }, take: 1 },
          habits: true,
        },
      },
    },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  let compatibility: number | null = null;

  if (userId && listing.owner.habits) {
    const seekerHabits = await prisma.habits.findUnique({
      where: { userId },
    });

    if (seekerHabits) {
      compatibility = calculateCompatibility(
        seekerHabits as any,
        listing.owner.habits as any,
        {
          smokersAllowed: listing.smokersAllowed,
          petsAllowed: listing.petsAllowed,
          pricePerMonth: listing.pricePerMonth,
        },
      );
    }
  }

  return { ...listing, compatibility };
}

export async function updateListing(
  listingId: string,
  ownerId: string,
  data: Partial<CreateListingData>,
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  if (listing.ownerId !== ownerId) {
    throw new AppError('Not authorized to update this listing', 403);
  }

  const updateData: any = { ...data };
  if (data.availableFrom) {
    updateData.availableFrom = new Date(data.availableFrom);
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: updateData,
    include: {
      photos: { orderBy: { position: 'asc' } },
    },
  });

  return updated;
}

export async function deleteListing(listingId: string, ownerId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  if (listing.ownerId !== ownerId) {
    throw new AppError('Not authorized to delete this listing', 403);
  }

  await prisma.listing.delete({
    where: { id: listingId },
  });

  return { message: 'Listing deleted' };
}

export async function updateStatus(
  listingId: string,
  ownerId: string,
  status: 'ACTIVE' | 'PAUSED' | 'RENTED',
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  if (listing.ownerId !== ownerId) {
    throw new AppError('Not authorized to update this listing', 403);
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { status },
    include: {
      photos: { orderBy: { position: 'asc' } },
    },
  });

  return updated;
}

export async function addListingPhoto(
  listingId: string,
  ownerId: string,
  url: string,
  position: number,
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  if (listing.ownerId !== ownerId) {
    throw new AppError('Not authorized to add photos to this listing', 403);
  }

  const photoCount = await prisma.listingPhoto.count({
    where: { listingId },
  });

  if (photoCount >= 10) {
    throw new AppError('Maximum of 10 photos allowed', 400);
  }

  const photo = await prisma.listingPhoto.create({
    data: { listingId, url, position },
  });

  return photo;
}

export async function deleteListingPhoto(
  listingId: string,
  ownerId: string,
  photoId: string,
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  if (listing.ownerId !== ownerId) {
    throw new AppError('Not authorized to delete photos from this listing', 403);
  }

  const photo = await prisma.listingPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo || photo.listingId !== listingId) {
    throw new AppError('Photo not found', 404);
  }

  await prisma.listingPhoto.delete({
    where: { id: photoId },
  });

  return { message: 'Photo deleted' };
}
