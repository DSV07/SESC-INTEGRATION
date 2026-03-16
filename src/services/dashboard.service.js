import { prisma } from '../config/db.js';
import { activityService } from './activity.service.js';

export class DashboardService {
  async getStats(userId) {
    const [notesCount, tasksCount, filesCount] = await Promise.all([
      prisma.note.count({ where: { user_id: userId } }),
      prisma.task.count({ where: { user_id: userId, status: 'PENDING' } }),
      prisma.file.count({ where: { is_shared: true } }), // total files on network
    ]);

    const recentActivities = await activityService.getRecent(userId);

    return {
      stats: {
        notes: notesCount,
        pendingTasks: tasksCount,
        files: filesCount,
      },
      recentActivities,
    };
  }
}

export const dashboardService = new DashboardService();
