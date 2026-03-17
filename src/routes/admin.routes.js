import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { adminMiddleware } from '../middleware/auth.js';

const adminRoutes = Router();

// Todas as rotas de admin exigem o middleware de admin
adminRoutes.use(adminMiddleware);

// CRUD Usuários
adminRoutes.get('/users', adminController.getUsers);
adminRoutes.post('/users', adminController.createUser);
adminRoutes.put('/users/:id', adminController.updateUser);
adminRoutes.delete('/users/:id', adminController.deleteUser);

// CRUD Cargos (Roles)
adminRoutes.get('/roles', adminController.getRoles);
adminRoutes.post('/roles', adminController.createRole);
adminRoutes.put('/roles/:id', adminController.updateRole);
adminRoutes.delete('/roles/:id', adminController.deleteRole);

// CRUD Departamentos
adminRoutes.get('/departments', adminController.getDepartments);
adminRoutes.post('/departments', adminController.createDepartment);
adminRoutes.put('/departments/:id', adminController.updateDepartment);
adminRoutes.delete('/departments/:id', adminController.deleteDepartment);

// CRUD Unidades
adminRoutes.get('/units', adminController.getUnits);
adminRoutes.post('/units', adminController.createUnit);
adminRoutes.put('/units/:id', adminController.updateUnit);
adminRoutes.delete('/units/:id', adminController.deleteUnit);

// Canais e Mensagens
adminRoutes.post('/channels', adminController.createChannel);
adminRoutes.put('/channels/:id', adminController.updateChannel);
adminRoutes.delete('/channels/:id', adminController.deleteChannel);
adminRoutes.delete('/channels/:channelId/messages', adminController.clearChannelMessages);
adminRoutes.post('/announcements', adminController.sendAnnouncement);

export { adminRoutes };
