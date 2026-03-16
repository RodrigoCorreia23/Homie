import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/errorHandler';

export async function addFavorite(userId: string, listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  const favorite = await prisma.favorite.upsert({
    where: { userId_listingId: { userId, listingId } },
    update: {},
    create: { userId, listingId },
  });

  return favorite;
}

export async function removeFavorite(userId: string, listingId: string) {
  await prisma.favorite.deleteMany({
    where: { userId, listingId },
  });

  return { message: 'Favorite removed' };
}

export async function getFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          pricePerMonth: true,
          city: true,
          type: true,
          status: true,
          photos: { orderBy: { position: 'asc' }, take: 1 },
          owner: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return favorites;
}
