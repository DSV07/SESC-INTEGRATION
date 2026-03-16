import { authService } from '../services/auth.service.js';

export class AuthController {
  async register(req, res) {
    const { name, email, password, role, department } = req.body;
    try {
      const result = await authService.register({ name, email, password, role, department });
      res.json(result);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      res.status(500).json({ error: 'Erro ao registrar usuário: ' + error.message });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;
    try {
      const result = await authService.login({ email, password });
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async getMe(req, res) {
    try {
      const user = await authService.getMe(req.user.id);
      res.json({ user });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();
