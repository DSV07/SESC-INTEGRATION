import { prisma } from '../config/db.js';

export const notificationsService = {
  async getAll(userId) {
    return await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20
    });
  },

  async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: { 
        user_id: userId,
        is_read: false
      }
    });
  },

  async markAsRead(notificationId, userId) {
    return await prisma.notification.update({
      where: { id: parseInt(notificationId), user_id: userId },
      data: { is_read: true }
    });
  },

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { user_id: userId },
      data: { is_read: true }
    });
  },

  async create(data) {
    return await prisma.notification.create({
      data: {
        user_id: data.user_id,
        type: data.type || 'MENTION',
        title: data.title,
        content: data.content,
        link: data.link
      }
    });
  }
};
