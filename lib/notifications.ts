import { PrismaClient } from '@prisma/client';
import { EmailService } from './email';
import webpush from 'web-push';
import { logger } from './logger';

const prisma = new PrismaClient();

webpush.setVapidDetails(
  'mailto:support@eventvendor.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export class NotificationService {
  // Create and send notification
  static async createNotification(data: {
    userId: string;
    type: 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP';
    title: string;
    message: string;
    bookingId?: string;
    metadata?: any;
  }) {
    try {
      // Save to database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          bookingId: data.bookingId,
          data: data.metadata,
        },
      });

      // Send based on type
      switch (data.type) {
        case 'EMAIL':
          await this.sendEmailNotification(data);
          break;
        case 'PUSH':
          await this.sendPushNotification(data.userId, data.title, data.message);
          break;
        case 'SMS':
          await this.sendSMSNotification(data.userId, data.message);
          break;
        case 'IN_APP':
          // Already saved to DB, real-time via WebSocket
          break;
      }

      logger.info(`Notification created: ${data.type}`, { notificationId: notification.id });
      return notification;
    } catch (error) {
      logger.error('Failed to create notification', { error, data });
      throw error;
    }
  }

  // Send email notification
  private static async sendEmailNotification(data: any) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user?.email) return;

    await EmailService.send({
      to: user.email,
      subject: data.title,
      html: `<div style="font-family: Arial, sans-serif;">
        <h2>${data.title}</h2>
        <p>${data.message}</p>
      </div>`,
    });
  }

  // Send push notification
  private static async sendPushNotification(userId: string, title: string, message: string) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({ title, message })
        );
      } catch (error) {
        logger.error('Push notification failed', { error, userId });
      }
    }
  }

  // Send SMS notification (using Twilio)
  private static async sendSMSNotification(userId: string, message: string) {
    // Implementation would use Twilio
    logger.info('SMS notification would be sent', { userId, message });
  }

  // Booking status change notification
  static async notifyBookingStatusChange(
    bookingId: string,
    oldStatus: string,
    newStatus: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vendor: true },
    });

    if (!booking) return;

    const statusMessages: Record<string, { title: string; message: string }> = {
      ACCEPTED: {
        title: 'Booking Accepted! 🎉',
        message: `Your booking with ${booking.vendor.name} has been accepted.`,
      },
      DECLINED: {
        title: 'Booking Declined',
        message: `Unfortunately, ${booking.vendor.name} declined your booking request.`,
      },
      CONFIRMED: {
        title: 'Booking Confirmed! ✅',
        message: 'Your booking is confirmed and ready to go!',
      },
    };

    const msg = statusMessages[newStatus];
    if (!msg) return;

    // Notify customer
    await this.createNotification({
      userId: booking.customerId,
      type: 'EMAIL',
      title: msg.title,
      message: msg.message,
      bookingId,
      metadata: { oldStatus, newStatus },
    });

    // Also send push if available
    await this.createNotification({
      userId: booking.customerId,
      type: 'PUSH',
      title: msg.title,
      message: msg.message,
      bookingId,
    });
  }

  // Get unread notifications
  static async getUnreadNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // Mark as read
  static async markAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // Mark all as read
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
