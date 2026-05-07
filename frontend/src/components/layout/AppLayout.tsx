import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import GovHeader from './GovHeader';
import { useState } from 'react';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <GovHeader />
      <div className="flex flex-1">
        <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>
          <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500 bg-white">
            © {new Date().getFullYear()} Government of India · Public Works Department
            <span className="mx-2">·</span> All rights reserved
            <span className="mx-2">·</span> Constructor ERP v1.0.0
          </footer>
        </div>
      </div>
    </div>
  );
}
