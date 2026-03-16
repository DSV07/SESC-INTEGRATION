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
          select: {
            name: true,
            avatar: true,
          }
        }
      },
      orderBy: { created_at: 'asc' },
    });

    return messages.map(msg => ({
      ...msg,
      user_name: msg.user.name,
      user_avatar: msg.user.avatar,
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
