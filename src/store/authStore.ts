import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  checkSession: () => Promise<void>;
}

const getStoredUser = () => {
  const user = localStorage.getItem('user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  checkSession: async () => {
    const { token, logout } = get();
    if (!token) {
      logout();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const { user } = await res.json();
        set({ user, isAuthenticated: true });
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      // Em caso de erro de rede, não deslogamos imediatamente para evitar logout involuntário em instabilidades
    }
  },
}));
