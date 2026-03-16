import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/errorHandler';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      photos: { orderBy: { position: 'asc' } },
      habits: true,
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
      createdAt: true,
      photos: { orderBy: { position: 'asc' } },
      habits: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: { name?: string; bio?: string; city?: string; role?: 'SEEKER' | 'LANDLORD' | 'BOTH' },
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
