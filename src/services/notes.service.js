import { prisma } from '../config/db.js';

export class NotesService {
  async getAll(userId) {
    // Busca notas próprias e notas compartilhadas com o usuário
    return await prisma.note.findMany({
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
      orderBy: [
        { is_pinned: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }

  async create(userId, { title, content, color, is_pinned }) {
    return await prisma.note.create({
      data: {
        user_id: userId,
        title,
        content: content || '',
        color: color || '#ffffff',
        is_pinned: !!is_pinned,
      },
    });
  }

  async update(userId, noteId, data) {
    const note = await prisma.note.findFirst({
      where: {
        id: Number(noteId),
        OR: [
          { user_id: userId },
          { shares: { some: { user_id: userId, permission: 'EDIT' } } }
        ]
      }
    });

    if (!note) throw new Error('Ação não permitida ou nota não encontrada');

    return await prisma.note.update({
      where: { id: Number(noteId) },
      data: {
        title: data.title ?? note.title,
        content: data.content ?? note.content,
        color: data.color ?? note.color,
        is_pinned: typeof data.is_pinned === 'boolean' ? data.is_pinned : note.is_pinned
      },
      include: {
        shares: {
          where: { user_id: userId },
          select: { permission: true }
        },
        user: {
          select: { name: true, avatar: true }
        }
      }
    });
  }

  async share(userId, noteId, { email, permission = 'VIEW' }) {
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) throw new Error('Usuário não encontrado');

    // Verifica se a nota pertence ao usuário
    const note = await prisma.note.findFirst({
      where: { id: Number(noteId), user_id: userId }
    });
    if (!note) throw new Error('Ação não permitida');

    return await prisma.sharedNote.create({
      data: {
        note_id: Number(noteId),
        user_id: targetUser.id,
        permission
      }
    });
  }

  async delete(userId, noteId) {
    // Dono pode deletar, compartilhado só remove o share? 
    // Por simplicidade, deletamos a nota se for o dono.
    return await prisma.note.deleteMany({
      where: {
        id: Number(noteId),
        user_id: userId,
      },
    });
  }
}

export const notesService = new NotesService();
