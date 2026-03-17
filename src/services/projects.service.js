import { prisma } from '../config/db.js';

export class ProjectsService {
  async getAll(userId) {
    return await prisma.project.findMany({
      where: {
        OR: [
          { user_id: userId },
          { shares: { some: { user_id: userId } } }
        ]
      },
      include: {
        user: { select: { name: true, avatar: true } },
        shares: {
            include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async create(userId, { name, description, color }) {
    return await prisma.project.create({
      data: {
        user_id: userId,
        name,
        description,
        color: color || '#3b82f6'
      }
    });
  }

  async update(userId, projectId, data) {
    const project = await prisma.project.findFirst({
      where: {
        id: Number(projectId),
        OR: [
          { user_id: userId },
          { shares: { some: { user_id: userId, permission: 'EDIT' } } }
        ]
      }
    });

    if (!project) throw new Error('Projeto não encontrado ou acesso negado');

    return await prisma.project.update({
      where: { id: Number(projectId) },
      data
    });
  }

  async delete(userId, projectId) {
    // Apenas o dono pode deletar o projeto
    const project = await prisma.project.findFirst({
      where: { id: Number(projectId), user_id: userId }
    });

    if (!project) throw new Error('Ação não permitida');

    return await prisma.project.delete({
      where: { id: Number(projectId) }
    });
  }

  async share(userId, projectId, { email, permission = 'VIEW' }) {
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) throw new Error('Usuário não encontrado');

    const project = await prisma.project.findFirst({
      where: { id: Number(projectId), user_id: userId }
    });
    if (!project) throw new Error('Ação não permitida');

    return await prisma.projectShare.create({
      data: {
        project_id: Number(projectId),
        user_id: targetUser.id,
        permission
      }
    });
  }
}

export const projectsService = new ProjectsService();
