import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users,
  LogOut,
  Bell,
  Search,
  Activity,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const sidebarLinks = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: ShieldAlert, label: 'Threat Log', path: '/admin/threats' },
  { icon: Activity, label: 'Analytics', path: '/admin/analytics' },
];

export const AdminLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/user" replace />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex font-sans selection:bg-neon-blue/30 selection:text-neon-blue">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2 text-xl font-display font-bold tracking-tight">
            <ShieldAlert className="text-neon-blue" size={24} />
            <span>Phish<span className="text-neon-green">BERT</span></span>
          </div>
        </div>

        <div className="flex-1 py-6 px-4 flex flex-col gap-2">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2 px-2">Menu</div>
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                  isActive ? "text-white bg-white/5" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue rounded-r-full"
                  />
                )}
                <Icon size={18} className={cn("transition-colors", isActive ? "text-neon-blue" : "group-hover:text-gray-300")} />
                {link.label}
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search logs, emails, or domains..." 
                className="w-full bg-[#111] border border-white/5 rounded-full py-1.5 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-red animate-pulse" />
            </button>
            <div className="w-px h-6 bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon-blue to-neon-purple p-[1px]">
                <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center text-xs font-bold text-neon-blue">
                  <User size={14} />
                </div>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-200">{user.email}</p>
                <p className="text-xs text-neon-blue">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
