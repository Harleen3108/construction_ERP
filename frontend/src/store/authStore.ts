import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
  updateUser: (u: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => {
    localStorage.setItem('auth', JSON.stringify({ user, token }));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const raw = localStorage.getItem('auth');
    if (!raw) return;
    try {
      const { user, token } = JSON.parse(raw);
      if (user && token) set({ user, token, isAuthenticated: true });
    } catch {
      localStorage.removeItem('auth');
    }
  },

  updateUser: (u) => {
    const cur = get().user;
    if (!cur) return;
    const updated = { ...cur, ...u };
    const token = get().token;
    localStorage.setItem('auth', JSON.stringify({ user: updated, token }));
    set({ user: updated });
  },
}));
