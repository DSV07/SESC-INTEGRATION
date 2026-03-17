import { prisma } from '../config/db.js';

export class PlannerService {
  async getAll(userId, projectId = null) {
    const where = {
      OR: [
        { user_id: userId },
        { shares: { some: { user_id: userId } } }
      ]
    };

    if (projectId) {
      where.project_id = Number(projectId);
    }

    return await prisma.task.findMany({
      where,
      include: {
        shares: {
          where: { user_id: userId },
          select: { permission: true }
        },
        user: {
          select: { name: true, avatar: true }
        },
        project: {
          select: { name: true, color: true }
        }
      },
      orderBy: [
        { status: 'asc' },
        { order: 'asc' },
        { created_at: 'desc' }
      ],
    });
  }

  async create(userId, { title, description, due_date, project_id, priority, status }) {
    return await prisma.task.create({
      data: {
        user_id: userId,
        title,
        description: description || '',
        due_date: due_date ? new Date(due_date) : null,
        project_id: project_id ? Number(project_id) : null,
        priority: priority || 'MEDIUM',
        status: status || 'TODO'
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
        project_id: data.project_id ? Number(data.project_id) : task.project_id,
        order: data.order !== undefined ? Number(data.order) : task.order
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
