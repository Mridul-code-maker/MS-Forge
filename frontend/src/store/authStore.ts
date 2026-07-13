import { create } from 'zustand';
import api from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  signup: (payload: {
    organizationName: string;
    tenantSlug: string;
    email: string;
    password: string;
    name: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const storedToken = window.localStorage.getItem('ms_forge_access_token');
      if (!storedToken) {
        set({ user: null, tenant: null, loading: false });
        return;
      }
      
      const res = await api.get('/api/v1/auth/me');
      set({
        user: {
          id: res.data.data.id,
          name: res.data.data.name,
          email: res.data.data.email,
          role: res.data.data.role,
          tenantId: res.data.data.tenant.id
        },
        tenant: res.data.data.tenant,
        loading: false,
        error: null
      });
    } catch (err) {
      set({ user: null, tenant: null, loading: false });
    }
  },

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/api/v1/auth/login', credentials);
      const { accessToken, user, tenant } = res.data.data;
      
      window.localStorage.setItem('ms_forge_access_token', accessToken);
      window.localStorage.setItem('ms_forge_user', JSON.stringify(user));
      
      set({ user, tenant, loading: false, error: null });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ loading: false, error: msg });
      return false;
    }
  },

  signup: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/api/v1/auth/signup', payload);
      const { accessToken, user, tenant } = res.data.data;

      window.localStorage.setItem('ms_forge_access_token', accessToken);
      window.localStorage.setItem('ms_forge_user', JSON.stringify(user));

      set({ user, tenant, loading: false, error: null });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Check if slug or email is taken.';
      set({ loading: false, error: msg });
      return false;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await api.post('/api/v1/auth/logout');
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      window.localStorage.removeItem('ms_forge_access_token');
      window.localStorage.removeItem('ms_forge_user');
      set({ user: null, tenant: null, loading: false, error: null });
    }
  }
}));
