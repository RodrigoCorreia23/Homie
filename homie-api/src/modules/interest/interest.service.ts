import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/errorHandler';
import { getIO } from '../../socket';
import { sendPushNotification } from '../../shared/utils/pushNotifications';

export async function sendInterest(userId: string, listingId: string, message?: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new AppError('Listing not found', 404);
  }

  if (listing.status !== 'ACTIVE') {
    throw new AppError('Listing is not active', 400);
  }

  if (listing.ownerId === userId) {
    throw new AppError('Cannot send interest on your own listing', 400);
  }

  const existing = await prisma.interest.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });

  if (existing) {
    throw new AppError('Interest already sent for this listing', 409);
  }

  const interest = await prisma.interest.create({
    data: {
      userId,
      listingId,
      message,
      status: 'PENDING',
    },
    include: {
      user: {
        select: { id: true, name: true, photos: { orderBy: { position: 'asc' }, take: 1 } },
      },
      listing: {
        select: { id: true, title: true },
      },
    },
  });

  // Notify listing owner via socket
  const io = getIO();
  io.to(`user:${listing.ownerId}`).emit('interest:received', interest);

  // Create notification
  await prisma.notification.create({
    data: {
      userId: listing.ownerId,
      type: 'NEW_INTEREST',
      title: 'New interest received',
      body: `${interest.user.name} is interested in "${listing.title}"`,
      data: { interestId: interest.id, listingId: listing.id },
    },
  });

  // Send push notification to listing owner
  await sendPushNotification(
    listing.ownerId,
    'New interest on your listing',
    `${interest.user.name} is interested in "${listing.title}"`,
    { interestId: interest.id, listingId: listing.id }
  );

  return interest;
}

export async function getSentInterests(userId: string) {
  const interests = await prisma.interest.findMany({
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
          photos: { orderBy: { position: 'asc' } },
        },
      },
    },
  });

  return interests;
}

export async function getReceivedInterests(userId: string) {
  const interests = await prisma.interest.findMany({
    where: {
      listing: { ownerId: userId },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          bio: true,
          city: true,
          photos: { orderBy: { position: 'asc' } },
        },
      },
      listing: {
        select: { id: true, title: true },
      },
    },
  });

  return interests;
}

export async function acceptInterest(interestId: string, userId: string) {
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: {
      listing: true,
      user: { select: { id: true, name: true } },
    },
  });

  if (!interest) {
    throw new AppError('Interest not found', 404);
  }

  if (interest.listing.ownerId !== userId) {
    throw new AppError('Not authorized to accept this interest', 403);
  }

  if (interest.status !== 'PENDING') {
    throw new AppError('Interest has already been processed', 400);
  }

  // Update interest status and create conversation in a transaction
  const [updatedInterest, conversation] = await prisma.$transaction(async (tx) => {
    const updated = await tx.interest.update({
      where: { id: interestId },
      data: { status: 'ACCEPTED' },
    });

    const conv = await tx.conversation.create({
      data: {
        interestId,
        members: {
          create: [
            { userId: interest.userId },
            { userId: userId },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, photos: { orderBy: { position: 'asc' }, take: 1 } },
            },
          },
        },
      },
    });

    return [updated, conv];
  });

  // Notify interest sender via socket
  const io = getIO();
  io.to(`user:${interest.userId}`).emit('interest:accepted', {
    interestId,
    conversationId: conversation.id,
    listing: { id: interest.listing.id, title: interest.listing.title },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: interest.userId,
      type: 'INTEREST_ACCEPTED',
      title: 'Interest accepted!',
      body: `Your interest in "${interest.listing.title}" has been accepted. Start chatting now!`,
      data: { interestId, conversationId: conversation.id, listingId: interest.listing.id },
    },
  });

  // Send push notification to the requester
  await sendPushNotification(
    interest.userId,
    'Your interest was accepted!',
    `Your interest in "${interest.listing.title}" has been accepted. Start chatting now!`,
    { interestId, conversationId: conversation.id, listingId: interest.listing.id }
  );

  return { interest: updatedInterest, conversation };
}

export async function rejectInterest(interestId: string, userId: string) {
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: {
      listing: true,
    },
  });

  if (!interest) {
    throw new AppError('Interest not found', 404);
  }

  if (interest.listing.ownerId !== userId) {
    throw new AppError('Not authorized to reject this interest', 403);
  }

  if (interest.status !== 'PENDING') {
    throw new AppError('Interest has already been processed', 400);
  }

  const updated = await prisma.interest.update({
    where: { id: interestId },
    data: { status: 'REJECTED' },
  });

  // Notify interest sender via socket
  const io = getIO();
  io.to(`user:${interest.userId}`).emit('interest:rejected', {
    interestId,
    listing: { id: interest.listing.id, title: interest.listing.title },
  });

  return updated;
}
