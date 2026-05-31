import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, MapPin, Building2, Calendar, Clock,
  User, LayoutGrid, Briefcase, ChevronRight,
  Users, ShieldCheck, UserCheck,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Company, Department, Employee } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatTenure(days: number): string {
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  if (y > 0) return m > 0 ? `${y}y ${m}mo` : `${y} year${y !== 1 ? 's' : ''}`;
  if (m > 0) return `${m} month${m !== 1 ? 's' : ''}`;
  return `${days} day${days !== 1 ? 's' : ''}`;
}

function getInitials(str: string) {
  return str.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const ROLE_META: Record<string, {
  label: string;
  badge: string;
  heroBadge: string;
  icon: typeof User;
}> = {
  admin:      { label: 'Administrator', badge: 'bg-emerald-100 text-emerald-700', heroBadge: 'bg-[#22C55E]/20 text-[#22C55E]',  icon: ShieldCheck },
  hr_manager: { label: 'HR Manager',    badge: 'bg-sky-100 text-sky-700',         heroBadge: 'bg-sky-400/25   text-sky-300',     icon: UserCheck },
  employee:   { label: 'Employee',      badge: 'bg-violet-100 text-violet-700',   heroBadge: 'bg-violet-400/20 text-violet-300', icon: Briefcase },
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="rounded-2xl bg-gray-200 h-52 w-full" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28" />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN / HR MANAGER VIEW
// ══════════════════════════════════════════════════════════════════════════════

interface AdminStats {
  companies?: number;
  departments: number;
  employees: number;
  loading: boolean;
}

const ACTIONS = [
  {
    icon: Building2, title: 'Manage Companies',
    desc: 'Add, edit, and remove company records',
    link: '/companies', roles: ['admin'],
  },
  {
    icon: LayoutGrid, title: 'Manage Departments',
    desc: 'Organise teams within your companies',
    link: '/departments', roles: ['admin', 'hr_manager'],
  },
  {
    icon: Users, title: 'Manage Employees',
    desc: 'Add, update, and track employee records',
    link: '/employees', roles: ['admin', 'hr_manager'],
  },
];

function AdminHRProfile() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const role     = user?.role ?? 'admin';
  const meta     = ROLE_META[role];
  const RoleIcon = meta.icon;

  const [stats, setStats] = useState<AdminStats>({ departments: 0, employees: 0, loading: true });
  const [visible, setVisible] = useState(false);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 40); return () => clearTimeout(t); }, []);

  useEffect(() => {
    (async () => {
      const results = await Promise.allSettled([
        isAdmin ? api.get<Company[]>('/companies/') : Promise.reject('skip'),
        api.get<Department[]>('/departments/'),
        api.get<Employee[]>('/employees/'),
      ]);
      const companiesCount    = results[0].status === 'fulfilled' ? (results[0].value as { data: Company[] }).data.length    : undefined;
      const departmentsCount  = results[1].status === 'fulfilled' ? (results[1].value as { data: Department[] }).data.length : 0;
      const employeesCount    = results[2].status === 'fulfilled' ? (results[2].value as { data: Employee[] }).data.length   : 0;
      setStats({ companies: companiesCount, departments: departmentsCount, employees: employeesCount, loading: false });
    })();
  }, [isAdmin]);

  const visibleActions = ACTIONS.filter((a) => a.roles.includes(role));

  const statCards = [
    ...(isAdmin ? [{ icon: Building2, label: 'Companies',   value: stats.companies,   color: 'text-[#2D3B55]', bg: 'bg-[#2D3B55]/10' }] : []),
    { icon: LayoutGrid, label: 'Departments', value: stats.departments, color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' },
    { icon: Users,      label: 'Employees',   value: stats.employees,   color: 'text-sky-500',   bg: 'bg-sky-500/10' },
  ];

  return (
    <div className={`max-w-4xl mx-auto space-y-5 transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
    }`}>

      {/* ── Hero card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-br from-[#2D3B55] via-[#243148] to-[#1b2538] px-8 py-10 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/25
            flex items-center justify-center mb-4 shadow-xl">
            <span className="text-white font-bold text-2xl leading-none">
              {getInitials(user?.email ?? '??')}
            </span>
          </div>
          {/* Info */}
          <p className="text-white font-bold text-xl">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.heroBadge}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              {meta.label}
            </span>
          </div>
          <p className="text-white/50 text-sm mt-3 max-w-xs">
            Manage your organisation's workforce from the dashboard
          </p>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {statCards.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2D3B55] leading-none">
                {stats.loading
                  ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
                  : (value ?? '—')}
              </p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Action cards ───────────────────────────────────────────── */}
      <div className={`grid gap-4 ${visibleActions.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {visibleActions.map(({ icon: Icon, title, desc, link }) => (
          <button
            key={link}
            onClick={() => navigate(link)}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-left
              hover:border-[#22C55E]/40 hover:shadow-md hover:-translate-y-0.5
              transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#2D3B55]/10 flex items-center justify-center
                group-hover:bg-[#22C55E]/15 transition-colors">
                <Icon className="w-5 h-5 text-[#2D3B55] group-hover:text-[#22C55E] transition-colors" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#22C55E]
                group-hover:translate-x-0.5 transition-all duration-200 mt-1" />
            </div>
            <p className="font-semibold text-[#2D3B55] text-sm">{title}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
          </button>
        ))}
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  EMPLOYEE FULL PROFILE
// ══════════════════════════════════════════════════════════════════════════════

function EmployeeProfile({ employee }: { employee: Employee }) {
  const { user } = useAuth();
  const role     = user?.role ?? 'employee';
  const meta     = ROLE_META[role];

  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 40); return () => clearTimeout(t); }, []);

  return (
    <div className={`max-w-4xl mx-auto space-y-5 transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
    }`}>

      {/* ── Hero card ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-lg">
        {/* Green accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#22C55E] to-[#16a34a]" />
        <div className="bg-gradient-to-br from-[#2D3B55] via-[#243148] to-[#1b2538] px-8 py-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#22C55E] flex items-center justify-center
              flex-shrink-0 shadow-lg shadow-[#22C55E]/30">
              <span className="text-white font-bold text-2xl leading-none">
                {getInitials(employee.name)}
              </span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white truncate">{employee.name}</h2>
              <p className="text-white/65 mt-0.5 flex items-center gap-2 text-sm">
                <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                {employee.title}
              </p>
              <p className="text-white/45 mt-0.5 flex items-center gap-2 text-xs">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                Company #{employee.company_id}
                <span className="text-white/25">·</span>
                <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
                Dept #{employee.department_id}
              </p>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.heroBadge}`}>
                {meta.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {/* Days employed */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#2D3B55]/10 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5 text-[#2D3B55]" />
          </div>
          <p className="text-3xl font-bold text-[#2D3B55] leading-none tabular-nums">
            {employee.days_employed.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wide">Days Employed</p>
          <p className="text-xs text-[#22C55E] font-semibold mt-0.5">{formatTenure(employee.days_employed)}</p>
        </div>

        {/* Hire date */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-5 h-5 text-[#22C55E]" />
          </div>
          <p className="text-sm font-bold text-[#2D3B55] leading-snug">
            {formatDateShort(employee.hire_date)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wide">Hire Date</p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5 text-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${
            employee.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'
          }`}>
            <User className={`w-5 h-5 ${
              employee.status === 'active' ? 'text-emerald-600' : 'text-gray-400'
            }`} />
          </div>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
            employee.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {employee.status === 'active' ? 'Active' : 'Inactive'}
          </span>
          <p className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wide">Status</p>
        </div>

        {/* Department */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-5 text-center">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto mb-3">
            <LayoutGrid className="w-5 h-5 text-sky-500" />
          </div>
          <p className="text-sm font-bold text-[#2D3B55] leading-snug">
            #{employee.department_id}
          </p>
          <p className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wide">Department</p>
        </div>

      </div>

      {/* ── 2-column details ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
            Personal Information
          </h3>
          <div className="space-y-4">
            {[
              { icon: Mail,   label: 'Email',   value: employee.email },
              { icon: Phone,  label: 'Mobile',  value: employee.mobile },
              { icon: MapPin, label: 'Address', value: employee.address || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5 break-all">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
            Work Information
          </h3>
          <div className="space-y-4">
            {[
              { icon: Briefcase,  label: 'Job Title',   value: employee.title },
              { icon: LayoutGrid, label: 'Department',  value: `Department #${employee.department_id}` },
              { icon: Building2,  label: 'Company',     value: `Company #${employee.company_id}` },
              { icon: Calendar,   label: 'Hire Date',   value: formatDate(employee.hire_date) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2D3B55]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-[#2D3B55]" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE
// ══════════════════════════════════════════════════════════════════════════════

export function ProfilePage() {
  const { isEmployee } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isEmployee) { setLoading(false); return; }
    try {
      const { data } = await api.get<Employee>('/employees/me/');
      setEmployee(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [isEmployee]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Admin / HR Manager — no API call needed for rendering the shell
  if (!isEmployee) return <AdminHRProfile />;

  if (loading) return <ProfileSkeleton />;

  if (notFound || !employee) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">No employee profile found</p>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            Your account isn't linked to an employee record yet.
            Please contact your HR manager.
          </p>
        </div>
      </div>
    );
  }

  return <EmployeeProfile employee={employee} />;
}
