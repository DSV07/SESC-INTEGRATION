import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';

export class AdminController {
  // Lógica de Usuários
  async getUsers(req, res) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        system_role: true,
        department: true,
        unit: true,
        avatar: true,
      },
    });
    res.json(users);
  }

  async createUser(req, res) {
    const { name, email, password, role, role_id, dept_id, unit_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        role_id: role_id ? parseInt(role_id) : null,
        dept_id: dept_id ? parseInt(dept_id) : null,
        unit_id: unit_id ? parseInt(unit_id) : null,
      },
    });
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  }

  async updateUser(req, res) {
    const { name, email, role, role_id, dept_id, unit_id } = req.body;
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        email,
        role,
        role_id: role_id ? parseInt(role_id) : null,
        dept_id: dept_id ? parseInt(dept_id) : null,
        unit_id: unit_id ? parseInt(unit_id) : null,
      },
    });
    res.json(user);
  }

  async deleteUser(req, res) {
    const userId = parseInt(req.params.id);
    try {
      // Limpeza manual profunda (Safe Delete) 
      // Deletar compartilhamentos primeiro (onde o usuário é destinatário OU dono da nota/tarefa)
      await prisma.sharedNote.deleteMany({ 
        where: { OR: [{ user_id: userId }, { note: { user_id: userId } }] } 
      });
      await prisma.sharedTask.deleteMany({ 
        where: { OR: [{ user_id: userId }, { task: { user_id: userId } }] } 
      });
      
      // Deletar registros diretos
      await prisma.message.deleteMany({ where: { user_id: userId } });
      await prisma.file.deleteMany({ where: { user_id: userId } });
      await prisma.note.deleteMany({ where: { user_id: userId } });
      await prisma.task.deleteMany({ where: { user_id: userId } });
      await prisma.activity.deleteMany({ where: { user_id: userId } });

      // Finalmente deletar o usuário
      await prisma.user.delete({ where: { id: userId } });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      // Extrair apenas a mensagem relevante para o usuário
      const errorMessage = error.message.includes('Foreign key constraint violated') 
        ? 'Erro de integridade: existem registros vinculados que não puderam ser removidos.'
        : 'Não foi possível excluir este usuário no momento.';
      res.status(400).json({ error: errorMessage });
    }
  }

  // Lógica de Cargos (SystemRoles)
  async getRoles(req, res) {
    const roles = await prisma.systemRole.findMany();
    res.json(roles);
  }
  async createRole(req, res) {
    const role = await prisma.systemRole.create({ data: { name: req.body.name } });
    res.json(role);
  }
  async updateRole(req, res) {
    const role = await prisma.systemRole.update({
      where: { id: parseInt(req.params.id) },
      data: { name: req.body.name },
    });
    res.json(role);
  }
  async deleteRole(req, res) {
    await prisma.systemRole.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  }

  // Lógica de Departamentos
  async getDepartments(req, res) {
    const depts = await prisma.systemDepartment.findMany();
    res.json(depts);
  }
  async createDepartment(req, res) {
    const dept = await prisma.systemDepartment.create({ data: { name: req.body.name } });
    res.json(dept);
  }
  async updateDepartment(req, res) {
    const dept = await prisma.systemDepartment.update({
      where: { id: parseInt(req.params.id) },
      data: { name: req.body.name },
    });
    res.json(dept);
  }
  async deleteDepartment(req, res) {
    await prisma.systemDepartment.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  }

  // Lógica de Unidades
  async getUnits(req, res) {
    const units = await prisma.systemUnit.findMany();
    res.json(units);
  }
  async createUnit(req, res) {
    const unit = await prisma.systemUnit.create({ data: { name: req.body.name } });
    res.json(unit);
  }
  async updateUnit(req, res) {
    const unit = await prisma.systemUnit.update({
      where: { id: parseInt(req.params.id) },
      data: { name: req.body.name },
    });
    res.json(unit);
  }
  async deleteUnit(req, res) {
    await prisma.systemUnit.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  }

  async getUsersForMentions(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuários para menções.' });
    }
  }

  async clearChannelMessages(req, res) {
    const { channelId } = req.params;
    try {
      await prisma.message.deleteMany({
        where: { channel_id: parseInt(channelId) }
      });
      res.json({ success: true, message: 'Mensagens do canal removidas com sucesso.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao limpar mensagens do canal.' });
    }
  }
}

export const adminController = new AdminController();
