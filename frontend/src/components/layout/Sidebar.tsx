import { NavLink, useNavigate } from 'react-router-dom';
import { Building2, FileText, LayoutDashboard, LayoutGrid, Users, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import logo from '../../assets/eBen Logo + YP Blue and Green.avif';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',   roles: ['admin', 'hr_manager'] },
  { to: '/companies',   icon: Building2,       label: 'Companies',   roles: ['admin', 'hr_manager'] },
  { to: '/departments', icon: LayoutGrid,      label: 'Departments', roles: ['admin', 'hr_manager'] },
  { to: '/employees',   icon: Users,           label: 'Employees',      roles: ['admin', 'hr_manager'] },
  { to: '/report',      icon: FileText,        label: 'Employee Report', roles: ['admin', 'hr_manager'] },
  { to: '/profile',     icon: UserCircle,      label: 'My Profile',     roles: ['admin', 'hr_manager', 'employee'] },
];

const ROLE_BADGE: Record<UserRole, string> = {
  admin:      'bg-emerald-500/20 text-emerald-400',
  hr_manager: 'bg-sky-500/20     text-sky-400',
  employee:   'bg-violet-500/20  text-violet-400',
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin:      'System Admin',
  hr_manager: 'HR Manager',
  employee:   'Employee',
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#2D3B55] flex flex-col z-30 select-none">

      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-white/[0.08]">
        <img src={logo} alt="eBen" className="h-9 w-auto" />
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                'font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#22C55E] text-white shadow-md shadow-[#22C55E]/25'
                  : 'text-white/65 hover:bg-white/[0.08] hover:text-white',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={[
                    'w-[18px] h-[18px] flex-shrink-0 transition-transform duration-150',
                    !isActive && 'group-hover:scale-110',
                  ].join(' ')}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User + logout ──────────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-3 border-t border-white/[0.08] space-y-1">

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.05]">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#22C55E]/25
            flex items-center justify-center">
            <span className="text-[#22C55E] font-bold text-sm leading-none">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate leading-tight">
              {user?.email}
            </p>
            {user?.role && (
              <span className={[
                'inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold',
                ROLE_BADGE[user.role],
              ].join(' ')}>
                {ROLE_LABEL[user.role]}
              </span>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
            text-white/55 hover:bg-white/[0.08] hover:text-white
            transition-all duration-150 group"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform duration-150" />
          Sign out
        </button>

      </div>
    </aside>
  );
}
