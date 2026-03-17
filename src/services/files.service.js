import { prisma } from '../config/db.js';

export class FilesService {
  async getAll(userId, isShared = false) {
    const location = isShared ? 'NETWORK' : 'PERSONAL';
    const where = isShared 
      ? { location: 'NETWORK' }
      : { user_id: userId, location: 'PERSONAL' };

    return await prisma.file.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async upload(userId, { name, size, type, content, location = 'PERSONAL' }) {
    return await prisma.file.create({
      data: {
        user_id: userId,
        name,
        size,
        type,
        content,
        location
      },
    });
  }

  async delete(userId, userRole, fileId) {
    const where = userRole === 'admin' 
      ? { id: Number(fileId) }
      : { id: Number(fileId), user_id: userId };

    return await prisma.file.deleteMany({
      where,
    });
  }
}

export const filesService = new FilesService();
