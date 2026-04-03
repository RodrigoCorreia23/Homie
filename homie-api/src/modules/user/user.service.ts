import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/errorHandler';
import { geocodeCity } from '../../shared/utils/geocoding';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      photos: { orderBy: { position: 'asc' } },
      habits: true,
      houseRules: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { passwordHash, refreshToken, ...safeUser } = user;
  return safeUser;
}

export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      bio: true,
      city: true,
      role: true,
      gender: true,
      createdAt: true,
      photos: { orderBy: { position: 'asc' } },
      habits: true,
      houseRules: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: { name?: string; bio?: string; city?: string; preferredCity?: string; role?: 'SEEKER' | 'LANDLORD' | 'BOTH'; gender?: 'MALE' | 'FEMALE' | 'OTHER' },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      photos: { orderBy: { position: 'asc' } },
      habits: true,
    },
  });

  return user;
}

export async function updateHabits(
  userId: string,
  data: {
    schedule: 'DAY' | 'NIGHT';
    smoker: boolean;
    pets: boolean;
    cleanliness: number;
    noise: number;
    visitors: number;
    budgetMin: number;
    budgetMax: number;
  },
) {
  const habits = await prisma.habits.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return habits;
}

export async function completeOnboarding(
  userId: string,
  data: {
    role: 'SEEKER' | 'LANDLORD' | 'BOTH';
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    preferredCity?: string;
    preferredCities?: string[];
    habits?: {
      schedule: 'DAY' | 'NIGHT';
      smoker: boolean;
      pets: boolean;
      cleanliness: number;
      noise: number;
      visitors: number;
      budgetMin: number;
      budgetMax: number;
    };
    houseRules?: {
      smokingPolicy: 'NOT_ALLOWED' | 'OUTSIDE_ONLY' | 'ALLOWED';
      petsPolicy: 'NOT_ALLOWED' | 'SMALL_ONLY' | 'ALLOWED';
      partiesPolicy: 'NOT_ALLOWED' | 'OCCASIONAL' | 'ALLOWED';
      overnightGuests: 'NOT_ALLOWED' | 'WITH_NOTICE' | 'ALLOWED';
      quietHoursStart?: string;
      quietHoursEnd?: string;
      cleanlinessLevel: number;
      preferredGender?: 'MALE' | 'FEMALE' | 'ANY';
      maxOccupants?: number;
    };
  },
) {
  // Resolve cities list — preferredCities takes priority, fallback to single preferredCity
  const cities = data.preferredCities?.length
    ? data.preferredCities
    : data.preferredCity
      ? [data.preferredCity]
      : [];
  const primaryCity = cities[0] || undefined;

  // Geocode primary city for geo search
  let preferredLatitude: number | undefined;
  let preferredLongitude: number | undefined;
  if (primaryCity) {
    const coords = await geocodeCity(primaryCity);
    if (coords) {
      preferredLatitude = coords.lat;
      preferredLongitude = coords.lng;
    }
  }

  // Update user role, gender, cities and coordinates
  await prisma.user.update({
    where: { id: userId },
    data: {
      role: data.role,
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(primaryCity !== undefined && {
        preferredCity: primaryCity,
        preferredCities: cities,
        preferredLatitude,
        preferredLongitude,
      }),
    },
  });

  // Upsert habits if provided (seeker / both)
  if (data.habits) {
    await prisma.habits.upsert({
      where: { userId },
      update: data.habits,
      create: { userId, ...data.habits },
    });
  }

  // Upsert house rules if provided (landlord / both)
  if (data.houseRules) {
    await prisma.houseRules.upsert({
      where: { userId },
      update: data.houseRules,
      create: { userId, ...data.houseRules },
    });
  }

  // Return updated profile
  return getProfile(userId);
}

export async function discoverSeekers(
  landlordId: string,
  filters: { city?: string; lat?: number; lng?: number; page?: number; limit?: number; radius?: number },
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const radius = filters.radius || 50;

  // Resolve search center: explicit coords > city filter > first listing's coords
  let searchLat = filters.lat;
  let searchLng = filters.lng;
  let cityFilter = filters.city;

  if (searchLat === undefined || searchLng === undefined) {
    if (filters.city) {
      const coords = await geocodeCity(filters.city);
      if (coords) {
        searchLat = coords.lat;
        searchLng = coords.lng;
      }
    } else {
      // Fallback: use landlord's first listing location
      const listings = await prisma.listing.findMany({
        where: { ownerId: landlordId, status: 'ACTIVE' },
        select: { city: true, latitude: true, longitude: true },
        take: 1,
      });
      if (listings.length > 0) {
        searchLat = listings[0].latitude;
        searchLng = listings[0].longitude;
        cityFilter = listings[0].city;
      }
    }
  }

  const where: any = {
    role: { in: ['SEEKER', 'BOTH'] },
    id: { not: landlordId },
    habits: { isNot: null },
  };

  // If we have coordinates, find seekers whose preferred location is within radius
  if (searchLat !== undefined && searchLng !== undefined) {
    const { boundingBox: bbox } = await import('../../shared/utils/geo');
    const box = bbox(searchLat, searchLng, radius);
    where.preferredLatitude = { gte: box.minLat, lte: box.maxLat };
    where.preferredLongitude = { gte: box.minLng, lte: box.maxLng };
  } else if (cityFilter) {
    where.preferredCity = { contains: cityFilter, mode: 'insensitive' };
  }

  const [seekers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        bio: true,
        gender: true,
        preferredCity: true,
        preferredLatitude: true,
        preferredLongitude: true,
        city: true,
        createdAt: true,
        photos: { orderBy: { position: 'asc' }, take: 1 },
        habits: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Calculate distance and sort by proximity
  const { haversineDistance } = await import('../../shared/utils/geo');
  const enriched = seekers.map((seeker) => {
    let distance: number | null = null;
    if (searchLat !== undefined && searchLng !== undefined && seeker.preferredLatitude && seeker.preferredLongitude) {
      distance = Math.round(
        haversineDistance(searchLat, searchLng, seeker.preferredLatitude, seeker.preferredLongitude) * 10
      ) / 10;
    }
    return { ...seeker, distance };
  }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

  return {
    seekers: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function addPhoto(userId: string, url: string, position: number) {
  const photoCount = await prisma.userPhoto.count({
    where: { userId },
  });

  if (photoCount >= 6) {
    throw new AppError('Maximum of 6 photos allowed', 400);
  }

  const photo = await prisma.userPhoto.create({
    data: { userId, url, position },
  });

  return photo;
}

export async function deletePhoto(userId: string, photoId: string) {
  const photo = await prisma.userPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw new AppError('Photo not found', 404);
  }

  if (photo.userId !== userId) {
    throw new AppError('Not authorized to delete this photo', 403);
  }

  await prisma.userPhoto.delete({
    where: { id: photoId },
  });

  return { message: 'Photo deleted' };
}

export async function updatePushToken(userId: string, token: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { expoPushToken: token },
  });
  return { message: 'Push token updated' };
}
