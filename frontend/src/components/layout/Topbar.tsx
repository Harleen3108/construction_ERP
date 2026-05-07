import { useAuthStore } from '../../store/authStore';
import { Bell, LogOut, Menu, User as UserIcon, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { roleLabel } from '../../utils/format';
import { useState } from 'react';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1 hover:bg-slate-100 rounded"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md w-72">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              placeholder="Search projects, tenders, bills..."
              className="bg-transparent flex-1 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-slate-100 rounded-full">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-erp-danger rounded-full" />
          </button>

          <div className="relative">
            <button
              className="flex items-center gap-2 hover:bg-slate-100 rounded-md px-2 py-1"
              onClick={() => setOpen((o) => !o)}
            >
              <div className="w-8 h-8 rounded-full bg-govt-navy text-white flex items-center justify-center font-bold text-sm">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-slate-800">{user.name}</div>
                <div className="text-[10px] text-slate-500">
                  {roleLabel(user.role)} · {user.department || 'PWD'}
                </div>
              </div>
            </button>
            {open && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-md border border-slate-200 shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                  <span className="mt-2 inline-block pill pill-info">{roleLabel(user.role)}</span>
                </div>
                <button
                  onClick={() => { setOpen(false); nav('/profile'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"
                >
                  <UserIcon className="w-4 h-4" /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 text-red-600"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
