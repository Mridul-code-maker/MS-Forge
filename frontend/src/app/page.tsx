'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Shield, 
  RefreshCw, 
  FileText, 
  BarChart4, 
  GitBranch, 
  Key, 
  Paperclip, 
  CheckCircle2, 
  Check, 
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

export default function LandingPage() {
  const { user, initialize } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    initialize();
    
    // Check saved theme preference on mount
    const savedTheme = window.localStorage.getItem('ms_forge_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, [initialize]);

  // Handle Dark Mode toggle
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

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${
      darkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-[#f7f9fb] text-[#191c1e]'
    }`}>
      
      {/* Top Sticky Navigation */}
      <header className={`fixed top-0 w-full border-b backdrop-blur-md z-50 transition-all h-16 ${
        darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-[#ffffff]/80 border-[#e0e3e5]'
      }`}>
        <div className="flex justify-between items-center h-full max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-sm tracking-wider">
              MS
            </div>
            <span className="text-lg font-bold tracking-tight">MS-Forge</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <a className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors" href="#features">Features</a>
            <a className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors" href="#pricing">Pricing</a>
            <a className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors" href="https://internship.readynest.in" target="_blank" rel="noreferrer">Docs</a>
            <a className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors" href="https://internship.readynest.in" target="_blank" rel="noreferrer">About</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-lg border transition-all ${
                darkMode ? 'border-slate-800 hover:bg-slate-900 text-amber-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'
              }`}
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <Link href="/dashboard" className="bg-[#4f46e5] text-white px-5 py-2 rounded-full font-semibold text-xs hover:opacity-95 shadow-sm transition-opacity">
                Dashboard
              </Link>
            ) : (
              <Link href="/signup" className="bg-[#4f46e5] text-white px-5 py-2 rounded-full font-semibold text-xs hover:opacity-95 shadow-sm transition-opacity">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Build, Scale, and Secure Collaborative Workspaces
            </h1>
            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              The precision platform for modern engineering teams. Forge high-performance environments with built-in security, real-time synchronization, and granular governance.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup" className="bg-[#4f46e5] text-white px-8 py-3 rounded-lg font-bold text-sm shadow-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <a href="https://internship.readynest.in" target="_blank" rel="noreferrer" className="bg-white dark:bg-slate-900 border border-[#e0e3e5] dark:border-slate-800 text-slate-700 dark:text-slate-350 px-8 py-3 rounded-lg font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center">
                View Documentation
              </a>
            </div>
          </div>

          {/* Kanban Mockup Asymmetric Layout */}
          <div className={`relative border rounded-xl p-6 md:p-8 overflow-hidden shadow-sm transition-colors ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-[#f2f4f6]/60 border-[#e0e3e5]'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Column: To Do */}
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs tracking-wider text-slate-400 uppercase">To Do</span>
                  <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-bold">4</span>
                </div>
                
                <div className={`border p-4 rounded-lg space-y-3 transition-colors ${
                  darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e0e3e5]'
                }`}>
                  <div className="flex gap-1 mb-1">
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">SECURITY</span>
                  </div>
                  <h4 className="font-bold text-sm">Implement OAuth2 Flow</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Update the identity provider service for the new production cluster.
                  </p>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-slate-400 text-white flex items-center justify-center text-[7px] font-bold">JD</div>
                      <div className="w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-indigo-500 text-white flex items-center justify-center text-[7px] font-bold">AS</div>
                    </div>
                    <Paperclip size={14} className="text-slate-400" />
                  </div>
                </div>

                <div className={`border p-3 rounded-lg opacity-60 transition-colors ${
                  darkMode ? 'bg-slate-950 border-slate-850' : 'bg-white border-[#e0e3e5]'
                }`}>
                  <h4 className="font-bold text-xs">Documentation Audit</h4>
                </div>
              </div>

              {/* Column: In Progress */}
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs tracking-wider text-slate-400 uppercase">In Progress</span>
                  <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded text-xs font-bold">2</span>
                </div>

                <div className={`border-2 p-4 rounded-lg space-y-3 relative transition-colors ${
                  darkMode ? 'bg-slate-950 border-[#4f46e5]' : 'bg-white border-[#4f46e5]'
                }`}>
                  <div className="absolute top-3 right-3 bg-[#4f46e5] text-white p-1 rounded-full animate-spin-slow">
                    <RefreshCw size={12} />
                  </div>
                  <div className="flex gap-1 mb-1">
                    <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded text-[10px] font-bold">URGENT</span>
                  </div>
                  <h4 className="font-bold text-sm">Scaling API Endpoints</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Optimizing the database queries for the workspace search engine.
                  </p>
                  <div className="flex justify-between items-center pt-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[7px] font-bold">ML</div>
                    <div className="flex items-center gap-1.5 text-[9px] text-[#4f46e5] font-bold uppercase tracking-tight">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] animate-pulse"></span>
                      Syncing
                    </div>
                  </div>
                </div>
              </div>

              {/* Column: Done */}
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs tracking-wider text-slate-400 uppercase">Done</span>
                  <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-bold">12</span>
                </div>

                <div className={`border p-4 rounded-lg space-y-3 transition-colors ${
                  darkMode ? 'bg-slate-950 border-slate-850' : 'bg-white border-[#e0e3e5]'
                }`}>
                  <h4 className="font-bold text-sm line-through text-slate-400">Database Migration</h4>
                  <div className="flex justify-between items-center pt-2">
                    <CheckCircle2 size={16} className="text-[#4f46e5]" />
                    <span className="text-[10px] text-slate-400 italic">Yesterday</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Feature Grid (Expanded to 6 items) */}
        <section id="features" className={`py-24 border-t transition-colors ${
          darkMode ? 'bg-slate-950 border-slate-900' : 'bg-white border-[#e0e3e5]'
        }`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">Forged for Excellence</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">The tools you need to manage complex projects at scale.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature Card 1 */}
              <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-4 hover:border-[#4f46e5] dark:hover:border-[#4f46e5] transition-colors group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-850 group-hover:bg-[#4f46e5] group-hover:text-white transition-colors">
                  <Shield size={20} className="text-slate-600 dark:text-slate-350 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Role-Based Access</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Define granular permissions at the organization, workspace, or individual task level.
                  </p>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-4 hover:border-[#4f46e5] dark:hover:border-[#4f46e5] transition-colors group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-850 group-hover:bg-[#4f46e5] group-hover:text-white transition-colors">
                  <RefreshCw size={20} className="text-slate-600 dark:text-slate-350 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Real-Time Sync</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Propagate changes instantly across all clients with our low-latency global edge network.
                  </p>
                </div>
              </div>

              {/* Feature Card 3 */}
              <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-4 hover:border-[#4f46e5] dark:hover:border-[#4f46e5] transition-colors group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-850 group-hover:bg-[#4f46e5] group-hover:text-white transition-colors">
                  <FileText size={20} className="text-slate-600 dark:text-slate-350 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Activity Logging</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Full immutable audit trails for every action taken within your workspaces for total transparency.
                  </p>
                </div>
              </div>

              {/* Feature Card 4 */}
              <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-4 hover:border-[#4f46e5] dark:hover:border-[#4f46e5] transition-colors group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-850 group-hover:bg-[#4f46e5] group-hover:text-white transition-colors">
                  <BarChart4 size={20} className="text-slate-600 dark:text-slate-350 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Advanced Analytics</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Gain deep insights into team performance and project velocity with automated data visualization.
                  </p>
                </div>
              </div>

              {/* Feature Card 5 */}
              <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-4 hover:border-[#4f46e5] dark:hover:border-[#4f46e5] transition-colors group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-850 group-hover:bg-[#4f46e5] group-hover:text-white transition-colors">
                  <GitBranch size={20} className="text-slate-600 dark:text-slate-350 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Custom Workflows</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Build and automate bespoke processes that align perfectly with your team's unique engineering culture.
                  </p>
                </div>
              </div>

              {/* Feature Card 6 */}
              <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-4 hover:border-[#4f46e5] dark:hover:border-[#4f46e5] transition-colors group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-850 group-hover:bg-[#4f46e5] group-hover:text-white transition-colors">
                  <Key size={20} className="text-slate-600 dark:text-slate-350 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">SSO Integration</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Streamline access and security with SAML-based enterprise single sign-on across your whole stack.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Stats/Visual Breakdown Section */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-12 border border-slate-850 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 h-40 w-40 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-600/20 rounded-full blur-3xl" />

            <div className="md:w-1/2 relative z-10">
              <h2 className="text-3xl font-extrabold tracking-tight mb-4">Ready to optimize your workflow?</h2>
              <p className="text-slate-400 text-base mb-8">
                Join over 10,000+ engineers who have switched to MS-Forge for their daily operations. Security is not an afterthought—it's the foundation.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-4xl font-extrabold text-[#c3c0ff]">99.9%</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uptime Guarantee</div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold text-[#c3c0ff]">256bit</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AES Encryption</div>
                </div>
              </div>
            </div>

            <div className="md:w-1/3 w-full bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl space-y-4 relative z-10">
              <div className="h-2.5 w-1/2 bg-white/20 rounded"></div>
              <div className="h-2.5 w-3/4 bg-white/20 rounded"></div>
              <div className="h-2.5 w-1/3 bg-[#4f46e5] rounded animate-pulse"></div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs font-bold">Pro Account</span>
                <span className="bg-[#4f46e5] text-white px-2 py-0.5 rounded text-[10px] font-bold">ACTIVE</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className={`py-24 border-t transition-colors ${
          darkMode ? 'bg-slate-950 border-slate-900' : 'bg-[#f2f4f6]/60 border-[#e0e3e5]'
        }`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">Simple, Scalable Pricing</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
                Choose the plan that fits your team's growth. All plans include core security features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Free Tier */}
              <div className={`p-8 rounded-xl border flex flex-col h-full hover:shadow-md transition-shadow ${
                darkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-[#e0e3e5]'
              }`}>
                <div className="mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter</span>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-extrabold">$0</span>
                    <span className="text-slate-500 text-sm ml-1">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Check size={16} className="text-[#4f46e5]" /> Up to 5 users
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Check size={16} className="text-[#4f46e5]" /> Basic Kanban boards
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Check size={16} className="text-[#4f46e5]" /> 1GB storage
                  </li>
                </ul>
                <Link href="/signup" className="w-full py-3 px-4 border border-[#e0e3e5] dark:border-slate-800 rounded-lg text-xs font-bold text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Get Started
                </Link>
              </div>

              {/* Pro Tier */}
              <div className={`p-8 rounded-xl border-2 border-[#4f46e5] flex flex-col h-full shadow-lg relative overflow-hidden ${
                darkMode ? 'bg-slate-900/60' : 'bg-white'
              }`}>
                <div className="absolute top-0 right-0 bg-[#4f46e5] text-white px-4 py-1 rounded-bl-lg text-[9px] font-black uppercase tracking-widest">Popular</div>
                <div className="mb-6">
                  <span className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider">Professional</span>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-extrabold">$19</span>
                    <span className="text-slate-500 text-sm ml-1">/user/mo</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center gap-2 text-xs font-semibold">
                    <Check size={16} className="text-[#4f46e5]" /> Unlimited users
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold">
                    <Check size={16} className="text-[#4f46e5]" /> Advanced Analytics
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold">
                    <Check size={16} className="text-[#4f46e5]" /> Custom Workflows
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold">
                    <Check size={16} className="text-[#4f46e5]" /> 100GB storage
                  </li>
                </ul>
                <Link href="/signup" className="w-full py-3 px-4 bg-[#4f46e5] text-white rounded-lg text-xs font-bold text-center shadow-sm hover:opacity-90 transition-opacity">
                  Start 14-Day Free Trial
                </Link>
              </div>

              {/* Enterprise Tier */}
              <div className={`p-8 rounded-xl border flex flex-col h-full hover:shadow-md transition-shadow ${
                darkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-white border-[#e0e3e5]'
              }`}>
                <div className="mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise</span>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-extrabold">Custom</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Check size={16} className="text-[#4f46e5]" /> Everything in Pro
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Check size={16} className="text-[#4f46e5]" /> SSO Integration
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Check size={16} className="text-[#4f46e5]" /> Dedicated Support
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Check size={16} className="text-[#4f46e5]" /> Custom SLA
                  </li>
                </ul>
                <a href="mailto:sales@msforge.com" className="w-full py-3 px-4 border border-[#e0e3e5] dark:border-slate-800 rounded-lg text-xs font-bold text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Contact Sales
                </a>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className={`border-t py-12 ${
        darkMode ? 'border-slate-900 bg-slate-950 text-slate-500' : 'border-[#e0e3e5] bg-[#ffffff] text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs tracking-wider">
                MS
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">MS-Forge</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 max-w-xs">
              High-performance collaboration infrastructure for high-growth engineering teams.
            </p>
            <p className="text-[10px] text-slate-400 opacity-60">© 2026 MS-Forge. All rights reserved.</p>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-white">Product</span>
            <a className="hover:text-[#4f46e5] transition-colors" href="#features">Features</a>
            <a className="hover:text-[#4f46e5] transition-colors" href="#pricing">Pricing</a>
            <a className="hover:text-[#4f46e5] transition-colors" href="https://internship.readynest.in" target="_blank" rel="noreferrer">Docs</a>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-white">Company</span>
            <a className="hover:text-[#4f46e5] transition-colors" href="https://internship.readynest.in" target="_blank" rel="noreferrer">About</a>
            <a className="hover:text-[#4f46e5] transition-colors" href="https://internship.readynest.in" target="_blank" rel="noreferrer">Contact</a>
            <a className="hover:text-[#4f46e5] transition-colors" href="https://internship.readynest.in" target="_blank" rel="noreferrer">Privacy Policy</a>
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-white">Connect</span>
            <a className="hover:text-[#4f46e5] transition-colors" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            <a className="hover:text-[#4f46e5] transition-colors" href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
