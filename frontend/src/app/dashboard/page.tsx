'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore, Task } from '../../store/taskStore';
import { Plus, LogOut, Shield, Search, Filter, ArrowUpDown, RefreshCw, Trash2, Edit3, CheckCircle2, Sun, Moon } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuthStore();
  const { tasks, loading: tasksLoading, fetchTasks, createTask, updateTask, deleteTask, setupWebSockets, cleanupWebSockets } = useTaskStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [darkMode, setDarkMode] = useState(false);

  // Sync theme on mount
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

  // Task Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication Protection Guard
  useEffect(() => {
    const token = window.localStorage.getItem('ms_forge_access_token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  // WebSocket Ingress Integration
  useEffect(() => {
    if (user?.tenantId) {
      setupWebSockets(user.tenantId);
      fetchTasks();
    }
    return () => {
      cleanupWebSockets();
    };
  }, [user, setupWebSockets, cleanupWebSockets, fetchTasks]);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Navbar Dashboard Header */}
      <header className="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-16 sticky top-0 z-30">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold tracking-wider">
              MS
            </div>
            <span className="font-bold text-lg tracking-tight">MS-Forge</span>
            <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">
              SaaS Board
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-semibold hidden md:inline">
              User: <span className="text-slate-600 dark:text-slate-200">{user.name}</span>
            </span>

            {/* Admin Console Ingress */}
            {user.role === 'Admin' && (
              <Link 
                href="/admin" 
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 px-4 text-xs font-semibold shadow-sm transition-all"
              >
                <Shield size={14} className="text-violet-500" /> Admin Console
              </Link>
            )}

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-lg border transition-all ${
                darkMode ? 'border-slate-800 hover:bg-slate-900 text-amber-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'
              }`}
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button 
              onClick={() => { logout(); router.push('/'); }} 
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        
        {/* Workspace Toolbar Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-8 border-slate-200 dark:border-slate-850">
          <div>
            <h1 className="text-2xl font-black tracking-tight mb-1">Task Sync Board</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Workspace logs sync instantly in real-time across your organization team.
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(Object.keys(columns) as Array<keyof typeof columns>).map((colName) => (
            <div key={colName} className="flex flex-col min-h-[500px] rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-100/40 dark:bg-slate-900/20 p-4">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-850">
                <span className="font-bold text-sm uppercase tracking-wider text-slate-500">
                  {colName === 'InProgress' ? 'In Progress' : colName}
                </span>
                <span className="rounded-full px-2.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
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
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
      </main>

      {/* Task Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl m-4">
            <h2 className="text-lg font-bold tracking-tight mb-4">Create New Workspace Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Integrate Stitch templates"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed requirements..."
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
