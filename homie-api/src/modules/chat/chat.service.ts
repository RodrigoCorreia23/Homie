import { prisma } from '../../config/database';
import { AppError } from '../../shared/middleware/errorHandler';
import { getIO } from '../../socket';
import { createNotification } from '../notification/notification.service';

export async function getConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              photos: {
                orderBy: { position: 'asc' },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const result = await Promise.all(
    conversations.map(async (conv) => {
      const otherMember = conv.members.find((m) => m.userId !== userId);
      const lastMessage = conv.messages[0] || null;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          read: false,
        },
      });

      return {
        id: conv.id,
        interestId: conv.interestId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        otherUser: otherMember
          ? {
              id: otherMember.user.id,
              name: otherMember.user.name,
              photo: otherMember.user.photos[0]?.url || null,
            }
          : null,
        lastMessage,
        unreadCount,
      };
    })
  );

  return result;
}

export async function getMessages(
  conversationId: string,
  userId: string,
  cursor?: string,
  limit: number = 50
) {
  // Verify user is a member
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (!membership) {
    throw new AppError('You are not a member of this conversation', 403);
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    include: {
      sender: {
        select: { id: true, name: true },
      },
    },
  });

  const hasMore = messages.length > limit;
  const results = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore
    ? results[results.length - 1].createdAt.toISOString()
    : null;

  return {
    messages: results,
    nextCursor,
  };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  // Verify sender is a member
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });

  if (!membership) {
    throw new AppError('You are not a member of this conversation', 403);
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
    },
    include: {
      sender: {
        select: { id: true, name: true },
      },
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Get the other member
  const otherMember = await prisma.conversationMember.findFirst({
    where: {
      conversationId,
      userId: { not: senderId },
    },
  });

  const io = getIO();

  // Emit to conversation room
  io.to(`conversation:${conversationId}`).emit('chat:newMessage', message);

  // Emit notification to other user
  if (otherMember) {
    io.to(`user:${otherMember.userId}`).emit('notification:new', {
      type: 'NEW_MESSAGE',
      title: `New message from ${message.sender.name}`,
      body: content.length > 100 ? content.substring(0, 100) + '...' : content,
      data: { conversationId },
    });

    // Create persistent notification
    await createNotification(
      otherMember.userId,
      'NEW_MESSAGE',
      `New message from ${message.sender.name}`,
      content.length > 100 ? content.substring(0, 100) + '...' : content,
      { conversationId }
    );
  }

  return message;
}

export async function markAsRead(conversationId: string, userId: string) {
  // Verify user is a member
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (!membership) {
    throw new AppError('You are not a member of this conversation', 403);
  }

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      read: false,
    },
    data: { read: true },
  });

  const io = getIO();
  io.to(`conversation:${conversationId}`).emit('chat:messagesRead', {
    conversationId,
    readBy: userId,
  });

  return { success: true };
}
