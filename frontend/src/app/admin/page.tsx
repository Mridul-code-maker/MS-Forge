'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { ArrowLeft, UserPlus, Users, ListTodo, Shield, CreditCard, RefreshCw, AlertTriangle, CheckCircle2, Sun, Moon } from 'lucide-react';

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

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { metrics, fetchMetrics } = useTaskStore();

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

  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Member form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [invitePassword, setInvitePassword] = useState('Temp1234!');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Subscription Mock checkout state
  const [plan, setPlan] = useState('Free Tier');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Auth RBAC restriction guard
  useEffect(() => {
    const token = window.localStorage.getItem('ms_forge_access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'Admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [membersRes, logsRes] = await Promise.all([
        api.get('/api/v1/tenants/members'),
        api.get('/api/v1/logs')
      ]);
      setMembers(membersRes.data.data);
      setLogs(logsRes.data.data);
      await fetchMetrics();
    } catch (err) {
      console.error('Failed to load admin telemetry data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadAdminData();
    }
  }, [user]);

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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <RefreshCw className="animate-spin text-violet-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      
      {/* Navbar Dashboard Header */}
      <header className="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-16 sticky top-0 z-30">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-2">
              <ArrowLeft size={16} />
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold tracking-wider">
              MS
            </div>
            <span className="font-bold text-lg tracking-tight">MS-Forge</span>
            <span className="text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded flex items-center gap-1.5">
              <Shield size={12} /> Admin Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-semibold hidden md:inline">
              Admin: <span className="text-slate-600 dark:text-slate-200">{user.name}</span>
            </span>

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
          </div>        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-1">Organization Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Provision users, modify roles, govern subscription billing, and monitor activity trails.
          </p>
        </div>

        {/* Top metrics dashboard row */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Active Members</span>
                <span className="text-2xl font-bold">{members.length}</span>
              </div>
              <Users className="text-violet-500" size={32} />
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Tasks</span>
                <span className="text-2xl font-bold">{metrics.counts.total}</span>
              </div>
              <ListTodo className="text-indigo-500" size={32} />
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Current Plan</span>
                <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{plan}</span>
              </div>
              <CreditCard className="text-emerald-500" size={32} />
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Done Rate</span>
                <span className="text-2xl font-bold">
                  {metrics.counts.total > 0 ? Math.round((metrics.counts.done / metrics.counts.total) * 100) : 0}%
                </span>
              </div>
              <CheckCircle2 className="text-sky-500" size={32} />
            </div>
          </div>
        )}

        {/* Member list & Invite Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Members List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Workspace Roster</h2>
            
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
                          member.role === 'Admin' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        {member.id !== user.id ? (
                          <button
                            onClick={() => handleRoleChange(member.id, member.role)}
                            className="font-bold text-violet-600 dark:text-violet-400 hover:underline"
                          >
                            Toggle Role
                          </button>
                        ) : (
                          <span className="text-slate-450 italic">Logged In</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invite Member form */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Invite Member</h2>

              {inviteSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs">
                  Member registered in workspace successfully!
                </div>
              )}

              {inviteError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs flex gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
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

            {/* Mock Billing Stripe Container */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-850">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <CreditCard size={14} className="text-emerald-500" /> Billing Management
              </h3>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                Unlock advanced features (unlimited projects, 24/7 pinger) via MS-Forge premium plan.
              </p>
              <button
                onClick={handleMockCheckout}
                disabled={isCheckingOut}
                className="w-full h-10 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} /> Opening Stripe...
                  </>
                ) : plan === 'Free Tier' ? (
                  'Upgrade to Premium Pro ($19/mo)'
                ) : (
                  'Downgrade Subscription'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs Trail Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Workspace Security Audit Logs</h2>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No activity logs recorded in this workspace.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-4 items-start p-3 border rounded border-slate-100 dark:border-slate-850 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                  <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold tracking-tight">
                    {log.user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold">{log.user.name} <span className="font-normal text-slate-400">({log.user.role})</span></span>
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
        </div>

      </main>

    </div>
  );
}
