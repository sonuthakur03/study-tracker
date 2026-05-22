import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Code2, Map, FolderKanban, GraduationCap,
  Settings, LogOut, Menu, X, Shield, ChevronDown, Flame, BookOpen, BookMarked
} from 'lucide-react';

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/dsa',      icon: Code2,           label: 'DSA Tracker' },
  { to: '/roadmap',  icon: Map,             label: 'Roadmap' },
  { to: '/projects', icon: FolderKanban,    label: 'Projects' },
  { to: '/college',   icon: GraduationCap,   label: 'College' },
  { to: '/subjects',  icon: BookMarked,      label: 'Subjects' },
  { to: '/settings', icon: Settings,        label: 'Settings' },
];

const adminItems = [
  { to: '/admin',          label: 'Admin Dashboard' },
  { to: '/admin/dsa',      label: 'Manage DSA' },
  { to: '/admin/roadmap',  label: 'Manage Roadmap' },
  { to: '/admin/users',    label: 'Manage Users' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-slate-900 text-white ${mobile ? 'w-72' : 'w-64'}`}>
      {/* Brand */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">StudyTrack</p>
            <p className="text-xs text-slate-400 mt-0.5">Nepal 🇳🇵</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-orange-400 text-xs font-bold flex-shrink-0">
            <Flame size={13} />
            {user?.streak}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} /> {label}
          </NavLink>
        ))}

        {/* Admin section */}
        {user?.role === 'admin' && (
          <div className="pt-2">
            <button
              onClick={() => setAdminOpen(p => !p)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white w-full transition-colors"
            >
              <Shield size={17} /> Admin
              <ChevronDown size={14} className={`ml-auto transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
            </button>
            {adminOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                {adminItems.map(({ to, label }) => (
                  <NavLink
                    key={to} to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg text-xs transition-colors ${
                        isActive ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
        >
          <LogOut size={17} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <Menu size={20} />
          </button>
          <span className="font-bold text-indigo-600">StudyTrack</span>
          <div className="w-8" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
