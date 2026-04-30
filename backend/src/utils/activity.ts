import { prisma } from './prisma';

export const logActivity = async (
  bookingId: string,
  action: string,
  details?: string
): Promise<void> => {
  try {
    await prisma.activityLog.create({
      data: {
        bookingId,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
