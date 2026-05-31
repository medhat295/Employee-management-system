import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/companies':   'Companies',
  '/departments': 'Departments',
  '/employees':   'Employees',
  '/report':      'Employee Report',
  '/profile':     'My Profile',
};

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] ?? 'Dashboard';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      {/* ── Main area (offset by sidebar width) ─────────────────── */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">

        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200
          px-6 h-16 flex items-center justify-between shadow-[0_1px_12px_rgba(0,0,0,0.04)]">

          <h1 className="text-[1.05rem] font-semibold text-[#2D3B55] tracking-tight">
            {title}
          </h1>

          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2D3B55]/10 border border-[#2D3B55]/15
              flex items-center justify-center cursor-default">
              <span className="text-[#2D3B55] font-bold text-sm leading-none">
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          </div>

        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>

      </div>
    </div>
  );
}
