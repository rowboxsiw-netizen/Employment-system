
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { User } from '../types';
import { 
  Users, 
  LayoutDashboard, 
  FileText, 
  LogOut, 
  Sparkles,
  Menu,
  X,
  Zap,
  ZapOff,
  RefreshCw,
  Cpu
} from 'lucide-react';
import ChatWidget from './ChatWidget';
import { checkApiConnection } from '../geminiService';

interface LayoutProps {
  user: User;
}

const Layout: React.FC<LayoutProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'checking' | 'working' | 'not-working'>('checking');

  useEffect(() => {
    const verifyStatus = async () => {
      setGeminiStatus('checking');
      const isWorking = await checkApiConnection();
      setGeminiStatus(isWorking ? 'working' : 'not-working');
    };
    verifyStatus();
    // Refresh status every 5 minutes
    const interval = setInterval(verifyStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Employees', icon: Users, path: '/employees' },
    { name: 'Documents', icon: FileText, path: '/documents' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Nexus EMS</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Status Panel */}
        <div className="p-4 mx-4 mb-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">System Health</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-300">Gemini Core</span>
              </div>
              <div className={`status-pulse ${geminiStatus === 'working' ? 'status-pulse-working' : geminiStatus === 'not-working' ? 'status-pulse-not-working' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${
                  geminiStatus === 'working' ? 'bg-emerald-500' :
                  geminiStatus === 'not-working' ? 'bg-red-500' :
                  'bg-slate-500 animate-pulse'
                }`} />
              </div>
            </div>
            <p className={`text-[9px] font-bold px-1 ${
              geminiStatus === 'working' ? 'text-emerald-400' :
              geminiStatus === 'not-working' ? 'text-red-400' :
              'text-slate-500'
            }`}>
              {geminiStatus === 'working' ? 'SERVICE IS WORKING' : 
               geminiStatus === 'not-working' ? 'SERVICE DISCONNECTED' : 
               'CHECKING CONNECTION...'}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} 
              className="w-8 h-8 rounded-lg bg-slate-700"
              alt="User"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.email?.split('@')[0]}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8">
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="hidden sm:flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-widest transition-all ${
              geminiStatus === 'working' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
              geminiStatus === 'not-working' ? 'bg-red-50 border-red-100 text-red-700' :
              'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              {geminiStatus === 'checking' ? <RefreshCw size={12} className="animate-spin" /> : 
               geminiStatus === 'working' ? <Zap size={12} className="fill-emerald-500 text-emerald-500" /> : 
               <ZapOff size={12} />}
              GEMINI API: {geminiStatus === 'working' ? 'WORKING' : geminiStatus === 'not-working' ? 'DO NOT WORKING' : 'SYNCING'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{user.displayName || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">System Global</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Tools */}
      <ChatWidget />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 md:hidden animate-in fade-in duration-200">
          <aside className="w-72 h-full bg-slate-900 text-white p-6 slide-in-from-left duration-300 animate-in">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <Sparkles className="text-indigo-400 w-6 h-6" />
                <span className="text-xl font-black">Nexus</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400">
                <X size={24} />
              </button>
            </div>
            
            <nav className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2">Main Navigation</p>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      location.pathname === item.path ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-bold">{item.name}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4">API STATUS</p>
                <div className={`mx-3 p-4 rounded-xl border flex flex-col gap-3 ${
                  geminiStatus === 'working' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2">
                    {geminiStatus === 'working' ? <Zap size={16} className="text-emerald-400" /> : <ZapOff size={16} className="text-red-400" />}
                    <span className={`text-xs font-black uppercase ${geminiStatus === 'working' ? 'text-emerald-400' : 'text-red-400'}`}>
                      Gemini API {geminiStatus === 'working' ? 'Working' : 'Do Not Working'}
                    </span>
                  </div>
                </div>
              </div>

              <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 mt-10 px-4 py-3 w-full">
                <LogOut size={20} />
                <span className="font-bold">Logout</span>
              </button>
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Layout;
