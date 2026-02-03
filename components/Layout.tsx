
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
  Search, 
  Bell, 
  Sparkles,
  Menu,
  X,
  Zap,
  ZapOff,
  RefreshCw
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
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Employees', icon: Users, path: '/employees' },
    { name: 'Forms & Documents', icon: FileText, path: '/documents' },
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
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase">
              {user.email?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.email}</p>
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

          <div className="flex items-center gap-4">
            {/* Gemini Status Badge */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
              geminiStatus === 'working' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
              geminiStatus === 'not-working' ? 'bg-red-50 border-red-100 text-red-700' :
              'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              {geminiStatus === 'checking' && <RefreshCw size={14} className="animate-spin" />}
              {geminiStatus === 'working' && <Zap size={14} className="fill-emerald-500 text-emerald-500" />}
              {geminiStatus === 'not-working' && <ZapOff size={14} />}
              <span className="uppercase tracking-wider">
                Gemini AI: {geminiStatus === 'working' ? 'Online' : geminiStatus === 'not-working' ? 'Offline' : 'Syncing'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">{user.displayName || 'Admin'}</p>
                <p className="text-xs text-slate-500 mt-0.5">Global Admin</p>
              </div>
              <img 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} 
                alt="Avatar" 
                className="w-10 h-10 rounded-xl bg-slate-100"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Tools */}
      <ChatWidget />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 md:hidden animate-in fade-in duration-200">
          <aside className="w-64 h-full bg-slate-900 text-white p-6 slide-in-from-left duration-300 animate-in">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold">Nexus EMS</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-slate-300 hover:text-white"
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              <div className="pt-4 mt-4 border-t border-slate-800">
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold ${
                    geminiStatus === 'working' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    geminiStatus === 'not-working' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'text-slate-500'
                  }`}>
                    {geminiStatus === 'working' ? <Zap size={12} /> : <ZapOff size={12} />}
                    Gemini: {geminiStatus.toUpperCase()}
                  </div>
              </div>

              <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 mt-8 pt-8 border-t border-slate-800 w-full">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Layout;
