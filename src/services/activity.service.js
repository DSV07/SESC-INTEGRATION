import { prisma } from '../config/db.js';

export class ActivityService {
  async log(userId, { type, description }) {
    return await prisma.activity.create({
      data: {
        user_id: userId,
        type,
        description,
      },
    });
  }

  async getRecent(userId) {
    return await prisma.activity.findMany({
      where: { user_id: userId },
      take: 10,
      orderBy: { created_at: 'desc' },
    });
  }
}

export const activityService = new ActivityService();
