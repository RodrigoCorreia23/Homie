import { prisma } from '../../config/database';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });

    if (!user?.expoPushToken) return;

    const message: PushMessage = {
      to: user.expoPushToken,
      title,
      body,
      ...(data && { data }),
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Push notification error:', error);
  }
}
