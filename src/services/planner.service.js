import { prisma } from '../config/db.js';

export class PlannerService {
  async getAll(userId) {
    return await prisma.task.findMany({
      where: {
        OR: [
          { user_id: userId },
          { shares: { some: { user_id: userId } } }
        ]
      },
      include: {
        shares: {
          where: { user_id: userId },
          select: { permission: true }
        },
        user: {
          select: { name: true, avatar: true }
        }
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(userId, { title, description, due_date }) {
    return await prisma.task.create({
      data: {
        user_id: userId,
        title,
        description: description || '',
        due_date: due_date ? new Date(due_date) : null,
      },
    });
  }

  async share(userId, taskId, { email, permission = 'VIEW' }) {
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) throw new Error('Usuário não encontrado');

    const task = await prisma.task.findFirst({
      where: { id: Number(taskId), user_id: userId }
    });
    if (!task) throw new Error('Ação não permitida');

    return await prisma.sharedTask.create({
      data: {
        task_id: Number(taskId),
        user_id: targetUser.id,
        permission
      }
    });
  }

  async update(userId, taskId, data) {
    // Verifica se é o dono ou tem permissão de EDIT
    const task = await prisma.task.findFirst({
      where: { 
        id: Number(taskId),
        OR: [
          { user_id: userId },
          { shares: { some: { user_id: userId, permission: 'EDIT' } } }
        ]
      }
    });

    if (!task) throw new Error('Ação não permitida ou tarefa não encontrada');

    return await prisma.task.update({
      where: { id: Number(taskId) },
      data: {
        ...data,
        due_date: data.due_date ? new Date(data.due_date) : task.due_date,
      },
    });
  }

  async delete(userId, taskId) {
    return await prisma.task.deleteMany({
      where: {
        id: Number(taskId),
        user_id: userId,
      },
    });
  }
}

export const plannerService = new PlannerService();
