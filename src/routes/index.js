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

const routes = Router();

// Públicas
routes.use('/auth', authRoutes);

// Protegidas (JWT)
routes.use(authMiddleware);

// Usuário
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
  res.json(note);
}));

routes.patch('/notes/:id', asyncHandler(async (req, res) => {
  const note = await notesService.update(req.user.id, req.params.id, req.body);
  res.json(note);
}));

routes.post('/notes/:id/share', asyncHandler(async (req, res) => {
  const share = await notesService.share(req.user.id, req.params.id, req.body);
  res.json(share);
}));

routes.delete('/notes/:id', asyncHandler(async (req, res) => {
  await notesService.delete(req.user.id, req.params.id);
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
  res.json(task);
}));

routes.delete('/planner/:id', asyncHandler(async (req, res) => {
  await plannerService.delete(req.user.id, req.params.id);
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

export { routes };
