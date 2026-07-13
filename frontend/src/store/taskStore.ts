import { create } from 'zustand';
import api from '../lib/api';
import { io, Socket } from 'socket.io-client';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Todo' | 'InProgress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  assigneeId: string | null;
  attachments: string;
  assignee?: { id: string; name: string; email: string };
}

export interface Activity {
  id: string;
  name: string;
  action: string;
  details: string;
  time: string;
}

export interface Metrics {
  counts: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  priorities: {
    Low: number;
    Medium: number;
    High: number;
  };
  recentActivity: Activity[];
}

interface TaskState {
  tasks: Task[];
  metrics: Metrics | null;
  loading: boolean;
  socket: Socket | null;
  
  fetchTasks: (filters?: {
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    order?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  
  createTask: (taskData: Omit<Task, 'id' | 'assignee'>) => Promise<boolean>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  fetchMetrics: () => Promise<void>;
  
  setupWebSockets: (tenantId: string) => void;
  cleanupWebSockets: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  metrics: null,
  loading: false,
  socket: null,

  fetchTasks: async (filters = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/api/v1/tasks', { params: filters });
      set({ tasks: res.data.data, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  createTask: async (taskData) => {
    try {
      await api.post('/api/v1/tasks', taskData);
      return true;
    } catch (err) {
      return false;
    }
  },

  updateTask: async (id, updates) => {
    try {
      await api.patch(`/api/v1/tasks/${id}`, updates);
      return true;
    } catch (err) {
      return false;
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/api/v1/tasks/${id}`);
      return true;
    } catch (err) {
      return false;
    }
  },

  fetchMetrics: async () => {
    try {
      const res = await api.get('/api/v1/tenants/metrics');
      set({ metrics: res.data.data });
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  },

  setupWebSockets: (tenantId) => {
    const existingSocket = get().socket;
    if (existingSocket) return;

    // Establish WebSocket connection
    const socket = io('http://localhost:5000');
    
    socket.emit('join_tenant', tenantId);

    // Real-time listeners: update local state instantly
    socket.on('task_created', (newTask: Task) => {
      set((state) => ({ tasks: [...state.tasks, newTask] }));
      get().fetchMetrics(); // Refresh analytics metrics
    });

    socket.on('task_updated', (updatedTask: Task) => {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      }));
      get().fetchMetrics();
    });

    socket.on('task_deleted', ({ id }: { id: string }) => {
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
      }));
      get().fetchMetrics();
    });

    set({ socket });
  },

  cleanupWebSockets: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
