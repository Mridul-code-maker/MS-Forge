'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore, Task } from '../../store/taskStore';
import { 
  Plus, LogOut, Shield, Search, Filter, ArrowUpDown, 
  RefreshCw, Trash2, ShieldAlert, Sun, Moon, 
  LayoutDashboard, Users, CreditCard, Bell, Menu, X, 
  TrendingUp, CircleDot, UserPlus, CheckCircle2, User, ChevronRight, Clock
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, tenant, logout, loading: authLoading } = useAuthStore();
  const { 
    tasks, loading: tasksLoading, fetchTasks, createTask, 
    updateTask, deleteTask, setupWebSockets, cleanupWebSockets,
    fetchMetrics, metrics 
  } = useTaskStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'kanban' | 'roster' | 'logs' | 'billing'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Filter & Search states for Kanban Board
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Admin Telemetry Data
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Invite Member Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [invitePassword, setInvitePassword] = useState('Temp1234!');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Subscription Mock Stripe State
  const [plan, setPlan] = useState('Free Tier');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Task Creation Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  // Sync theme preference on mount
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('ms_forge_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('ms_forge_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('ms_forge_theme', 'light');
    }
  };

  // Authentication Protection Guard
  useEffect(() => {
    const token = window.localStorage.getItem('ms_forge_access_token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  // Load Admin Roster and Audit Logs
  const loadAdminData = async () => {
    if (user?.role !== 'Admin') return;
    setLoadingAdmin(true);
    try {
      const [membersRes, logsRes] = await Promise.all([
        api.get('/api/v1/tenants/members'),
        api.get('/api/v1/logs')
      ]);
      setMembers(membersRes.data.data);
      setLogs(logsRes.data.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  // Fetch admin logs and roster when changing to Admin-scoped tabs
  useEffect(() => {
    if (user && (activeTab === 'roster' || activeTab === 'logs')) {
      loadAdminData();
    }
  }, [activeTab, user]);

  // WebSocket Integration & Initial Loading
  useEffect(() => {
    if (user?.tenantId) {
      setupWebSockets(user.tenantId);
      fetchTasks();
      fetchMetrics();
    }
    return () => {
      cleanupWebSockets();
    };
  }, [user, setupWebSockets, cleanupWebSockets, fetchTasks, fetchMetrics]);

  // Dynamic WebSocket Live Notifications Tray Link
  useEffect(() => {
    const activeSocket = useTaskStore.getState().socket;
    if (activeSocket) {
      const handleTaskNotification = (actionText: string) => {
        setNotifications((prev) => [
          {
            id: Math.random().toString(),
            text: actionText,
            time: 'Just now',
            unread: true
          },
          ...prev.slice(0, 19) // Limit to 20 recent notifications
        ]);
      };

      activeSocket.on('task_created', (newTask: Task) => {
        handleTaskNotification(`New task created: "${newTask.title}"`);
      });
      activeSocket.on('task_updated', (updatedTask: Task) => {
        handleTaskNotification(`Task status updated to ${updatedTask.status}: "${updatedTask.title}"`);
      });
      activeSocket.on('task_deleted', ({ title }: { id: string, title?: string }) => {
        handleTaskNotification(`Task was deleted: "${title || 'Untitled task'}"`);
      });

      return () => {
        activeSocket.off('task_created');
        activeSocket.off('task_updated');
        activeSocket.off('task_deleted');
      };
    }
  }, [tasksLoading]);

  // Trigger task fetch upon filter state changes
  useEffect(() => {
    if (user) {
      fetchTasks({
        search,
        status: statusFilter,
        priority: priorityFilter,
        sortBy,
        order
      });
    }
  }, [search, statusFilter, priorityFilter, sortBy, order, user, fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !dueDate) return;

    setIsSubmitting(true);
    const success = await createTask({
      title,
      description,
      status: 'Todo',
      priority,
      dueDate,
      assigneeId: user?.id || null,
      attachments: JSON.stringify([])
    });

    setIsSubmitting(false);
    if (success) {
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'Todo' | 'InProgress' | 'Done') => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !invitePassword) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      await api.post('/api/v1/tenants/members', {
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
        password: invitePassword
      });
      setInviteSuccess(true);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('Member');
      setInvitePassword('Temp1234!');
      await loadAdminData();
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to invite member.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, currentRole: string) => {
    const nextRole = currentRole === 'Admin' ? 'Member' : 'Admin';
    if (confirm(`Change this member's role to ${nextRole}?`)) {
      try {
        await api.patch(`/api/v1/tenants/members/${memberId}/role`, { role: nextRole });
        await loadAdminData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Role change aborted.');
      }
    }
  };

  const handleMockCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setPlan(plan === 'Free Tier' ? 'MS-Forge Premium Pro' : 'Free Tier');
      alert('Mock Stripe Checkout complete! Subscribed successfully.');
    }, 1500);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <RefreshCw className="animate-spin text-violet-500" size={32} />
      </div>
    );
  }

  // Group tasks by Kanban column status
  const columns = {
    Todo: tasks.filter(t => t.status === 'Todo'),
    InProgress: tasks.filter(t => t.status === 'InProgress'),
    Done: tasks.filter(t => t.status === 'Done')
  };

  // SVG Chart data generator
  const getTaskTrends = () => {
    const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const completedCount = tasks.filter(t => t.status === 'Done').length;
    return [
      { month: 'Feb', created: 3, completed: 1 },
      { month: 'Mar', created: 7, completed: 3 },
      { month: 'Apr', created: 13, completed: 7 },
      { month: 'May', created: 16, completed: 10 },
      { month: 'Jun', created: 21, completed: 14 },
      { month: 'Jul', created: tasks.length || 25, completed: completedCount || 9 }
    ];
  };

  const trends = getTaskTrends();
  const totalTasksCount = tasks.length || 25;
  const todoCount = columns.Todo.length;
  const inProgressCount = columns.InProgress.length;
  const doneCount = columns.Done.length;

  const donePct = Math.round((doneCount / totalTasksCount) * 100) || 36;
  const ipPct = Math.round((inProgressCount / totalTasksCount) * 100) || 12;
  const todoPct = Math.round((todoCount / totalTasksCount) * 100) || 52;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      
      {/* 1. SIDEBAR PANEL */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transform lg:translate-x-0 transition-transform duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col">
          {/* Brand header */}
          <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2.5 font-black text-lg tracking-tight">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold tracking-wider">
                MS
              </div>
              MS-Forge
            </Link>
            <button className="lg:hidden text-slate-500 hover:text-slate-900" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Org details */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Organization</div>
            <div className="font-bold text-sm truncate">{tenant?.name || 'My SaaS Platform'}</div>
            <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded mt-1.5">
              {plan}
            </span>
          </div>

          {/* Sidebar Menu Navigation Links */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 h-10 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'overview' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
              }`}
            >
              <LayoutDashboard size={16} /> Overview
            </button>
            <button 
              onClick={() => { setActiveTab('kanban'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 h-10 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'kanban' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
              }`}
            >
              <CircleDot size={16} /> Task Board
            </button>
            {user.role === 'Admin' && (
              <>
                <button 
                  onClick={() => { setActiveTab('roster'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 h-10 rounded-lg text-xs font-bold tracking-wide transition-all ${
                    activeTab === 'roster' 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <Users size={16} /> Team Roster
                </button>
                <button 
                  onClick={() => { setActiveTab('logs'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 h-10 rounded-lg text-xs font-bold tracking-wide transition-all ${
                    activeTab === 'logs' 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <ShieldAlert size={16} /> Security Logs
                </button>
                <button 
                  onClick={() => { setActiveTab('billing'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 h-10 rounded-lg text-xs font-bold tracking-wide transition-all ${
                    activeTab === 'billing' 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <CreditCard size={16} /> Subscriptions
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate mr-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="truncate text-left">
              <div className="font-bold text-xs truncate leading-none mb-1">{user.name}</div>
              <div className="text-[10px] text-slate-400 truncate leading-none capitalize">{user.role}</div>
            </div>
          </div>
          <button 
            onClick={() => { logout(); router.push('/'); }} 
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 2. MAIN LAYOUT AREA */}
      <div className="flex-1 min-h-screen flex flex-col lg:pl-64">
        
        {/* Top Sticky Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-500 hover:text-slate-900 p-1" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              {activeTab === 'overview' ? 'Dashboard Overview' :
               activeTab === 'kanban' ? 'Task Sync Board' :
               activeTab === 'roster' ? 'Workspace Roster' :
               activeTab === 'logs' ? 'Security Audit Logs' :
               'SaaS Plan & Billing'}
            </h2>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Real-time Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`p-2 rounded-lg border relative transition-all ${
                  showNotifDropdown ? 'border-slate-800 bg-slate-100 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
                title="Notifications"
              >
                <Bell size={15} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
                )}
              </button>

              {showNotifDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-4 animate-in fade-in-50 duration-150">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850 mb-3">
                      <span className="font-bold text-xs uppercase tracking-wider">Live Activity feed</span>
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                        }}
                        className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline font-bold"
                      >
                        Clear Indicators
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          No live events captured in this session.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="flex gap-2.5 items-start text-xs border-b border-slate-50 dark:border-slate-850/50 pb-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                            <div className="space-y-0.5 text-left">
                              <p className="text-slate-700 dark:text-slate-300 font-medium">{n.text}</p>
                              <span className="text-[9px] text-slate-400 font-bold block">{n.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dark Mode toggle */}
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-lg border transition-all ${
                darkMode ? 'border-slate-800 hover:bg-slate-900 text-amber-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'
              }`}
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* 3. TABS MAIN AREA WRAPPER */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-200">
              
              {/* Telemetry metrics KPI cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Active Roster</span>
                    <span className="text-2xl font-bold">{members.length || 10}</span>
                  </div>
                  <div className="h-11 w-11 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-500 flex items-center justify-center">
                    <Users size={22} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Tasks</span>
                    <span className="text-2xl font-bold">{totalTasksCount}</span>
                  </div>
                  <div className="h-11 w-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center">
                    <CircleDot size={22} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Done Rate</span>
                    <span className="text-2xl font-bold">{donePct}%</span>
                  </div>
                  <div className="h-11 w-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 size={22} />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Current Plan</span>
                    <span className="text-sm font-bold text-violet-600 dark:text-violet-400 truncate">{plan}</span>
                  </div>
                  <div className="h-11 w-11 rounded-lg bg-sky-50 dark:bg-sky-950/20 text-sky-500 flex items-center justify-center">
                    <CreditCard size={22} />
                  </div>
                </div>
              </div>

              {/* 2. CHART GRAPH CONTAINERS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Line graph: Monthly task trends */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
                  <div className="mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Monthly Task Trends</span>
                    <span className="text-[11px] text-slate-500">Comparing created vs completed tasks over the last 6 months</span>
                  </div>
                  
                  {/* SVG line graph */}
                  <div className="w-full h-48 mt-2 relative">
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeDasharray="3" className="dark:stroke-slate-800" />
                      <line x1="40" y1="95" x2="480" y2="95" stroke="#f1f5f9" strokeDasharray="3" className="dark:stroke-slate-800" />
                      <line x1="40" y1="160" x2="480" y2="160" stroke="#f8fafc" className="dark:stroke-slate-850" />
                      
                      {/* Created line fill gradient */}
                      <defs>
                        <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area plots */}
                      <path 
                        d={`M 40,160 L 40,${160 - (trends[0].created / 30) * 130} L 128,${160 - (trends[1].created / 30) * 130} L 216,${160 - (trends[2].created / 30) * 130} L 304,${160 - (trends[3].created / 30) * 130} L 392,${160 - (trends[4].created / 30) * 130} L 480,${160 - (trends[5].created / 30) * 130} L 480,160 Z`}
                        fill="url(#createdGrad)"
                      />
                      <path 
                        d={`M 40,160 L 40,${160 - (trends[0].completed / 30) * 130} L 128,${160 - (trends[1].completed / 30) * 130} L 216,${160 - (trends[2].completed / 30) * 130} L 304,${160 - (trends[3].completed / 30) * 130} L 392,${160 - (trends[4].completed / 30) * 130} L 480,${160 - (trends[5].completed / 30) * 130} L 480,160 Z`}
                        fill="url(#completedGrad)"
                      />

                      {/* Poly lines */}
                      <polyline
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={`40,${160 - (trends[0].created / 30) * 130} 128,${160 - (trends[1].created / 30) * 130} 216,${160 - (trends[2].created / 30) * 130} 304,${160 - (trends[3].created / 30) * 130} 392,${160 - (trends[4].created / 30) * 130} 480,${160 - (trends[5].created / 30) * 130}`}
                      />
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={`40,${160 - (trends[0].completed / 30) * 130} 128,${160 - (trends[1].completed / 30) * 130} 216,${160 - (trends[2].completed / 30) * 130} 304,${160 - (trends[3].completed / 30) * 130} 392,${160 - (trends[4].completed / 30) * 130} 480,${160 - (trends[5].completed / 30) * 130}`}
                      />

                      {/* Data Dots */}
                      {trends.map((t, i) => (
                        <g key={t.month}>
                          <circle cx={40 + i * 88} cy={160 - (t.created / 30) * 130} r="3.5" fill="#8b5cf6" stroke="white" strokeWidth="1" className="dark:stroke-slate-900" />
                          <circle cx={40 + i * 88} cy={160 - (t.completed / 30) * 130} r="3.5" fill="#10b981" stroke="white" strokeWidth="1" className="dark:stroke-slate-900" />
                        </g>
                      ))}
                    </svg>

                    {/* X axis labels */}
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1 px-8">
                      {trends.map(t => <span key={t.month}>{t.month}</span>)}
                    </div>
                  </div>

                  {/* Chart legends */}
                  <div className="flex gap-4 justify-center text-[10px] font-bold text-slate-500 mt-4">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" /> Tasks Created</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Tasks Completed</span>
                  </div>
                </div>

                {/* Apple-watch style Activity Rings for Status breakdown */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Task Breakdown</span>
                    <span className="text-[11px] text-slate-500">Distribution by workflow status</span>
                  </div>

                  {/* SVG progress rings */}
                  <div className="flex items-center justify-center py-4">
                    <svg width="150" height="150" viewBox="0 0 120 120" className="transform -rotate-90">
                      {/* Done Ring (Outer) */}
                      <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" strokeWidth="6" className="dark:stroke-slate-800" />
                      <circle cx="60" cy="60" r="48" fill="none" stroke="#10b981" strokeWidth="6"
                        strokeDasharray={301.6}
                        strokeDashoffset={301.6 - (donePct / 100) * 301.6}
                        strokeLinecap="round"
                      />

                      {/* In Progress Ring (Middle) */}
                      <circle cx="60" cy="60" r="38" fill="none" stroke="#f1f5f9" strokeWidth="6" className="dark:stroke-slate-800" />
                      <circle cx="60" cy="60" r="38" fill="none" stroke="#6366f1" strokeWidth="6"
                        strokeDasharray={238.7}
                        strokeDashoffset={238.7 - (ipPct / 100) * 238.7}
                        strokeLinecap="round"
                      />

                      {/* Todo Ring (Inner) */}
                      <circle cx="60" cy="60" r="28" fill="none" stroke="#f1f5f9" strokeWidth="6" className="dark:stroke-slate-800" />
                      <circle cx="60" cy="60" r="28" fill="none" stroke="#64748b" strokeWidth="6"
                        strokeDasharray={175.9}
                        strokeDashoffset={175.9 - (todoPct / 100) * 175.9}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  {/* Ring legends */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center border-t border-slate-100 dark:border-slate-850 pt-4">
                    <div>
                      <span className="text-emerald-500 block text-xs">{doneCount}</span>
                      <span className="text-slate-400 block text-[9px] uppercase mt-0.5">Done</span>
                    </div>
                    <div>
                      <span className="text-indigo-500 block text-xs">{inProgressCount}</span>
                      <span className="text-slate-400 block text-[9px] uppercase mt-0.5">Working</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">{todoCount}</span>
                      <span className="text-slate-400 block text-[9px] uppercase mt-0.5">Todo</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent activity summary panel */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4">Live Session Activities</span>
                <div className="space-y-4">
                  {notifications.slice(0, 4).length === 0 ? (
                    <div className="py-6 text-slate-400 text-xs flex items-center justify-center gap-2">
                      <Clock size={16} /> WebSockets listening for team events...
                    </div>
                  ) : (
                    notifications.slice(0, 4).map((n) => (
                      <div key={n.id} className="flex justify-between items-center text-xs pb-3 border-b border-slate-100 dark:border-slate-850 last:border-b-0 last:pb-0">
                        <div className="flex gap-3 items-center">
                          <span className="h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
                          <span className="font-medium text-slate-700 dark:text-slate-350">{n.text}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: KANBAN BOARD */}
          {activeTab === 'kanban' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Workspace Toolbar Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-8 border-slate-200 dark:border-slate-850">
                <div className="text-left">
                  <h1 className="text-xl font-black tracking-tight mb-1">Task Sync Board</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Collaborate with your team instantly. Changes synchronize in real-time.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 pl-9 pr-4 w-48 sm:w-64 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                    />
                  </div>

                  {/* Filter Priority */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="h-10 px-4 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none transition-all"
                  >
                    <option value="">All Priorities</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>

                  {/* Sort Order */}
                  <button
                    onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                    className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Reverse Sort Order"
                  >
                    <ArrowUpDown size={16} />
                  </button>

                  {/* Create Task Button Trigger */}
                  <button
                    onClick={() => setShowModal(true)}
                    className="h-10 inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-5 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all"
                  >
                    <Plus size={16} /> Create Task
                  </button>
                </div>
              </div>

              {/* 3-Column Kanban Board Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                {(Object.keys(columns) as Array<keyof typeof columns>).map((colName) => (
                  <div key={colName} className="flex flex-col min-h-[500px] rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-100/40 dark:bg-slate-900/20 p-4">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-850">
                      <span className="font-bold text-sm uppercase tracking-wider text-slate-550">
                        {colName === 'InProgress' ? 'In Progress' : colName}
                      </span>
                      <span className="rounded-full px-2.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-300 font-bold">
                        {columns[colName].length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
                      {columns[colName].length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          No active tasks in this section.
                        </div>
                      ) : (
                        columns[colName].map((task) => (
                          <div 
                            key={task.id} 
                            className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative group"
                          >
                            <h3 className="font-bold text-sm mb-1.5">{task.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                              {task.description}
                            </p>

                            {/* Due Date */}
                            <div className="text-[10px] text-slate-400 font-bold mb-4">
                              DUE: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>

                            <div className="flex justify-between items-center">
                              <span className={`rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                task.priority === 'High' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                                'bg-slate-100 text-slate-650 dark:bg-slate-805 dark:text-slate-400'
                              }`}>
                                {task.priority}
                              </span>

                              {/* Kanban state transitions */}
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {colName !== 'Todo' && (
                                  <button 
                                    onClick={() => handleStatusChange(task.id, 'Todo')} 
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 px-2 py-1 rounded font-bold"
                                    title="Move to Todo"
                                  >
                                    Todo
                                  </button>
                                )}
                                {colName !== 'InProgress' && (
                                  <button 
                                    onClick={() => handleStatusChange(task.id, 'InProgress')} 
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 px-2 py-1 rounded font-bold"
                                    title="Move to InProgress"
                                  >
                                    Work
                                  </button>
                                )}
                                {colName !== 'Done' && (
                                  <button 
                                    onClick={() => handleStatusChange(task.id, 'Done')} 
                                    className="text-[10px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded font-bold"
                                    title="Mark as Done"
                                  >
                                    Done
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDelete(task.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors ml-1"
                                  title="Delete Task"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS ROSTER */}
          {activeTab === 'roster' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Roster table */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Workspace Roster</h2>
                
                {loadingAdmin ? (
                  <div className="py-12 flex justify-center"><RefreshCw className="animate-spin text-violet-500" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                          <th className="pb-3 font-semibold">Name</th>
                          <th className="pb-3 font-semibold">Email</th>
                          <th className="pb-3 font-semibold">Role</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {members.map(member => (
                          <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/20">
                            <td className="py-3.5 font-bold">{member.name}</td>
                            <td className="py-3.5 text-slate-500 dark:text-slate-400">{member.email}</td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded font-semibold ${
                                member.role === 'Admin' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="py-3.5 text-right font-bold">
                              {member.id !== user.id ? (
                                <button
                                  onClick={() => handleRoleChange(member.id, member.role)}
                                  className="text-violet-600 dark:text-violet-400 hover:underline"
                                >
                                  Toggle Role
                                </button>
                              ) : (
                                <span className="text-slate-400 italic font-normal">Logged In</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Roster Invite form */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Invite Member</h2>

                  {inviteSuccess && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs">
                      Member registered in workspace successfully!
                    </div>
                  )}

                  {inviteError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs flex gap-2">
                      <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                      {inviteError}
                    </div>
                  )}

                  <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="e.g. john@msforge.com"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Workspace Role</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none transition-all"
                        >
                          <option value="Member">Member</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Temp Password</label>
                        <input
                          type="text"
                          required
                          value={invitePassword}
                          onChange={(e) => setInvitePassword(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isInviting}
                      className="w-full h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-full font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={14} /> {isInviting ? 'Inviting...' : 'Invite Member'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Workspace Security Audit Logs</h2>

              {loadingAdmin ? (
                <div className="py-12 flex justify-center"><RefreshCw className="animate-spin text-violet-500" /></div>
              ) : (
                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No activity logs recorded in this workspace.
                    </div>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="flex gap-4 items-start p-3.5 border rounded border-slate-100 dark:border-slate-850 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                        <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold shrink-0">
                          {log.user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold">{log.user.name} <span className="font-normal text-slate-450">({log.user.role})</span></span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(log.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-violet-600 dark:text-violet-400">{log.action}: </span>
                            <span className="text-slate-600 dark:text-slate-350">{log.details}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-8 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
              
              {/* Plan metrics */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-2xl">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Workspace Billing Summary</h2>
                <p className="text-xs text-slate-500 mb-6">Manage your plan and usage limits dynamically.</p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-between items-baseline border-b border-slate-150 dark:border-slate-850 pb-6 mb-6">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Current Active Plan</span>
                    <span className="text-xl font-black text-violet-600 dark:text-violet-400">{plan}</span>
                  </div>
                  
                  <button
                    onClick={handleMockCheckout}
                    disabled={isCheckingOut}
                    className="h-10 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 font-bold text-xs transition-colors flex items-center justify-center gap-2 px-6"
                  >
                    {isCheckingOut ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} /> Processing Checkout...
                      </>
                    ) : plan === 'Free Tier' ? (
                      'Upgrade to Premium ($19/mo)'
                    ) : (
                      'Cancel Subscription Plan'
                    )}
                  </button>
                </div>
                
                {/* Limits progress bar */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-bold">
                      <span className="text-slate-500">Workspace Members Limit</span>
                      <span className="text-slate-700 dark:text-slate-350">{members.length || 10} / {plan === 'Free Tier' ? '10' : 'Unlimited'}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full" style={{ width: plan === 'Free Tier' ? '100%' : '15%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-bold">
                      <span className="text-slate-500">Task Workspace Items</span>
                      <span className="text-slate-700 dark:text-slate-350">{totalTasksCount} / {plan === 'Free Tier' ? '25' : 'Unlimited'}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full" style={{ width: plan === 'Free Tier' ? '100%' : '20%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Starter</div>
                    <div className="text-3xl font-black mb-3">$0</div>
                    <ul className="space-y-2 text-xs text-slate-500 mb-6">
                      <li>✓ Up to 10 members</li>
                      <li>✓ Basic Kanban board</li>
                      <li>✓ SQLite file db storage</li>
                    </ul>
                  </div>
                  <button disabled className="w-full h-10 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-bold bg-slate-50 dark:bg-slate-850 cursor-not-allowed">Active Plan</button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-violet-500 dark:border-violet-500 flex flex-col justify-between min-h-[300px] relative shadow-lg">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Popular</span>
                  <div>
                    <div className="text-violet-500 font-bold uppercase tracking-wider text-[10px] mb-1">Professional</div>
                    <div className="text-3xl font-black mb-3">$19 <span className="text-xs text-slate-400 font-medium">/ month</span></div>
                    <ul className="space-y-2 text-xs text-slate-500 mb-6 font-medium">
                      <li>✓ Unlimited members</li>
                      <li>✓ Interactive SVG analytics</li>
                      <li>✓ Real-time WebSocket sync</li>
                      <li>✓ Security logs trail</li>
                    </ul>
                  </div>
                  <button 
                    onClick={handleMockCheckout}
                    className="w-full h-10 bg-violet-600 text-white rounded-full text-xs font-bold hover:bg-violet-700 transition-colors"
                  >
                    {plan === 'Free Tier' ? 'Upgrade Plan' : 'Downgrade Plan'}
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Enterprise</div>
                    <div className="text-3xl font-black mb-3">Custom</div>
                    <ul className="space-y-2 text-xs text-slate-500 mb-6">
                      <li>✓ Unlimited projects</li>
                      <li>✓ Dedicated SQL db replica</li>
                      <li>✓ 24/7 SLA Uptime Guarantee</li>
                      <li>✓ 1-on-1 engineer support</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => alert('Contacting our sales team at sales@msforge.com...')}
                    className="w-full h-10 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Task Creation Modal (Shared across tabs) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl m-4">
            <h2 className="text-lg font-bold tracking-tight mb-4 text-left">Create New Workspace Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Integrate Stripe telemetry"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed task guidelines..."
                  rows={3}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none transition-all"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 px-4 rounded-full border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
