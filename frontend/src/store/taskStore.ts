import { create } from 'zustand';
import api, { API_BASE } from '../lib/api';
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
  createdAt?: string;
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
  socketConnected: boolean;
  
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
  socketConnected: false,

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

    // Establish WebSocket connection with retry limits and delay options
    const socket = io(API_BASE, {
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 20000
    });
    
    // Auto-join room on connect or auto-reconnect
    socket.on('connect', () => {
      console.log('WebSocket connected. Joining tenant room:', tenantId);
      socket.emit('join_tenant', tenantId);
      set({ socketConnected: true });
    });

    // Handle connection error
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      set({ socketConnected: false });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.warn('WebSocket disconnected. Reason:', reason);
      set({ socketConnected: false });
      if (reason === 'io server disconnect') {
        // Reconnect manually if the server killed the connection
        socket.connect();
      }
    });

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
      set({ socket: null, socketConnected: false });
    }
  },
}));
