import { prisma } from '../config/db.js';

export class ChannelsService {
  async getAll() {
    return await prisma.channel.findMany();
  }

  async getMessages(channelId) {
    const messages = await prisma.message.findMany({
      where: { channel_id: Number(channelId) },
      include: {
        user: {
          include: {
            system_role: true,
            department: true,
            unit: true,
          }
        }
      },
      orderBy: { created_at: 'asc' },
    });

    return messages.map(msg => ({
      ...msg,
      user_name: msg.user.name,
      user_avatar: msg.user.avatar,
      user_role_tag: msg.user.system_role?.name,
      user_dept_tag: msg.user.department?.name,
      user_unit_tag: msg.user.unit?.name,
    }));
  }

  async createMessage({ channel_id, user_id, content }) {
    const message = await prisma.message.create({
      data: {
        channel_id,
        user_id,
        content,
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          }
        }
      }
    });

    return {
      ...message,
      user_name: message.user.name,
      user_avatar: message.user.avatar,
    };
  }
}

export const channelsService = new ChannelsService();
