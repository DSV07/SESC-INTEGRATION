import { prisma } from '../config/db.js';

export class ChannelsService {
  async getAll() {
    return await prisma.channel.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async createChannel({ name, description }) {
    return await prisma.channel.create({
      data: { name, description }
    });
  }

  async updateChannel(id, { name, description }) {
    return await prisma.channel.update({
      where: { id: Number(id) },
      data: { name, description }
    });
  }

  async deleteChannel(id) {
    return await prisma.channel.delete({
      where: { id: Number(id) }
    });
  }

  async getMessages(channelId) {
    try {
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
    } catch (err) {
      console.error('❌ Erro ao buscar mensagens (tentando fallback):', err.message);
      // Fallback: se a coluna is_announcement não existir, o findMany falha.
      // Em um ambiente real, poderíamos tentar uma query raw ou apenas retornar vazio para não quebrar o front
      return []; 
    }
  }

  async createMessage({ channel_id, user_id, content, is_announcement = false }) {
    const message = await prisma.message.create({
      data: {
        channel_id,
        user_id,
        content,
        is_announcement
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
