import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const authRoutes = Router();

authRoutes.post('/login', authController.login);
authRoutes.get('/me', authMiddleware, authController.getMe);

export { authRoutes };
