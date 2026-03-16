import { authService } from '../services/auth.service.js';
import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';

export class UserController {
  async updateProfile(req, res) {
    const { name, department, avatar } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name, department, avatar },
      });
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  }

  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedNewPassword },
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  }
}

export const userController = new UserController();
