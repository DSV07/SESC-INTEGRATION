import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { authMiddleware } from '../middleware/auth.js';
import { notesService } from '../services/notes.service.js';
import { plannerService } from '../services/planner.service.js';
import { filesService } from '../services/files.service.js';
import { dashboardService } from '../services/dashboard.service.js';
import { activityService } from '../services/activity.service.js';
import { channelsService } from '../services/channels.service.js';
import { userController } from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import { adminController } from '../controllers/admin.controller.js';
import { adminRoutes } from './admin.routes.js';
import { notificationsService } from '../services/notifications.service.js';

const routes = Router();

// Públicas
routes.use('/auth', authRoutes);

// Protegidas (JWT)
routes.use(authMiddleware);

// Administrativas
routes.use('/admin', adminRoutes);

// Usuário
routes.get('/users', adminController.getUsersForMentions);
routes.put('/user/profile', asyncHandler(userController.updateProfile));
routes.post('/user/change-password', asyncHandler(userController.changePassword));

// Dashboard
routes.get('/dashboard/stats', asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user.id);
  res.json(stats);
}));

// Notas
routes.get('/notes', asyncHandler(async (req, res) => {
  const notes = await notesService.getAll(req.user.id);
  res.json(notes);
}));

routes.post('/notes', asyncHandler(async (req, res) => {
  const note = await notesService.create(req.user.id, req.body);
  await activityService.log(req.user.id, { type: 'NOTE_CREATE', description: `Criou a nota: ${note.title}` });
  
  const io = req.app.get('io');
  io.emit(`notes_updated_${req.user.id}`, { action: 'CREATE', note });
  
  res.json(note);
}));

routes.patch('/notes/:id', asyncHandler(async (req, res) => {
  const note = await notesService.update(req.user.id, req.params.id, req.body);
  
  const io = req.app.get('io');
  // Notifica o dono
  io.emit(`notes_updated_${note.user_id}`, { action: 'UPDATE', note });
  // Notifica quem compartilha (simplificado - emitindo para salas ou filtrando no front)
  io.emit(`note_sync_${req.params.id}`, { action: 'UPDATE', note });
  
  res.json(note);
}));

routes.post('/notes/:id/share', asyncHandler(async (req, res) => {
  const share = await notesService.share(req.user.id, req.params.id, req.body);
  res.json(share);
}));

routes.delete('/notes/:id', asyncHandler(async (req, res) => {
  await notesService.delete(req.user.id, req.params.id);
  
  const io = req.app.get('io');
  io.emit(`notes_updated_${req.user.id}`, { action: 'DELETE', noteId: req.params.id });
  io.emit(`note_sync_${req.params.id}`, { action: 'DELETE', noteId: req.params.id });

  res.json({ success: true });
}));

// Planner (Tasks)
routes.get('/planner', asyncHandler(async (req, res) => {
  const tasks = await plannerService.getAll(req.user.id);
  res.json(tasks);
}));

routes.post('/planner', asyncHandler(async (req, res) => {
  const task = await plannerService.create(req.user.id, req.body);
  await activityService.log(req.user.id, { type: 'TASK_CREATE', description: `Criou a tarefa: ${task.title}` });
  
  const io = req.app.get('io');
  io.emit(`tasks_updated_${req.user.id}`, { action: 'CREATE', task });
  
  res.json(task);
}));

routes.post('/planner/:id/share', asyncHandler(async (req, res) => {
  const share = await plannerService.share(req.user.id, req.params.id, req.body);
  res.json(share);
}));

routes.patch('/planner/:id', asyncHandler(async (req, res) => {
  const task = await plannerService.update(req.user.id, req.params.id, req.body);
  if (req.body.status === 'COMPLETED') {
    await activityService.log(req.user.id, { type: 'TASK_COMPLETE', description: `Concluiu a tarefa: ${task.title}` });
  }

  const io = req.app.get('io');
  // Notifica o dono
  io.emit(`tasks_updated_${task.user_id}`, { action: 'UPDATE', task });
  // Notifica quem compartilha
  io.emit(`task_sync_${req.params.id}`, { action: 'UPDATE', task });

  res.json(task);
}));

routes.delete('/planner/:id', asyncHandler(async (req, res) => {
  await plannerService.delete(req.user.id, req.params.id);
  
  const io = req.app.get('io');
  io.emit(`tasks_updated_${req.user.id}`, { action: 'DELETE', taskId: req.params.id });
  io.emit(`task_sync_${req.params.id}`, { action: 'DELETE', taskId: req.params.id });

  res.json({ success: true });
}));

// Arquivos
routes.get('/files', asyncHandler(async (req, res) => {
  const isShared = req.query.shared === 'true';
  const files = await filesService.getAll(req.user.id, isShared);
  res.json(files);
}));

routes.post('/files', asyncHandler(async (req, res) => {
  const file = await filesService.upload(req.user.id, req.body);
  await activityService.log(req.user.id, { type: 'FILE_UPLOAD', description: `Enviou o arquivo: ${file.name}` });
  res.json(file);
}));

routes.delete('/files/:id', asyncHandler(async (req, res) => {
  await filesService.delete(req.user.id, req.params.id);
  res.json({ success: true });
}));

// Canais de Chat
routes.get('/channels', asyncHandler(async (req, res) => {
  const channels = await channelsService.getAll();
  res.json(channels);
}));

routes.get('/channels/:id/messages', asyncHandler(async (req, res) => {
  const messages = await channelsService.getMessages(req.params.id);
  res.json(messages);
}));

// Notificações
routes.get('/notifications', asyncHandler(async (req, res) => {
  const notifications = await notificationsService.getAll(req.user.id);
  res.json(notifications);
}));

routes.get('/notifications/unread-count', asyncHandler(async (req, res) => {
  const count = await notificationsService.getUnreadCount(req.user.id);
  res.json({ count });
}));

routes.patch('/notifications/:id/read', asyncHandler(async (req, res) => {
  await notificationsService.markAsRead(req.params.id, req.user.id);
  res.json({ success: true });
}));

routes.post('/notifications/read-all', asyncHandler(async (req, res) => {
  await notificationsService.markAllAsRead(req.user.id);
  res.json({ success: true });
}));

// Health Check
routes.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export { routes };
