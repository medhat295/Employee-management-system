import { useEffect, useState } from 'react';
import {
  Building2, Clock, LayoutDashboard, LayoutGrid, ShieldCheck,
  UserCheck, UserX, Users,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Company, Department, Employee, User } from '../types';
import { getInitials } from '../utils/format';
import { useCountUp } from '../hooks/useCountUp';
import { TableSkeletonRow } from '../components/ui/TableSkeleton';

// ── Skeletons ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-100 rounded" />
          <div className="h-9 w-16 bg-gray-200 rounded" />
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  bg: string;
  iconCls: string;
}

function StatCard({ label, value, icon: Icon, bg, iconCls }: StatCardProps) {
  const n = useCountUp(value);
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-4xl font-bold text-[#2D3B55] mt-1 tabular-nums">{n}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon className={`w-6 h-6 ${iconCls}`} />
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const [companies, setCompanies]   = useState<Company[]>([]);
  const [departments, setDepts]     = useState<Department[]>([]);
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [hrManagers, setHrManagers] = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [now, setNow]               = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const requests: Promise<void>[] = [
      api.get<Company[]>('/companies/').then(r => setCompanies(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get<Department[]>('/departments/').then(r => setDepts(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get<Employee[]>('/employees/').then(r => setEmployees(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
    ];
    if (isAdmin) {
      requests.push(
        api.get<User[]>('/accounts/users/', { params: { role: 'hr_manager' } })
          .then(r => setHrManagers(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      );
    }
    Promise.all(requests).finally(() => setLoading(false));
  }, [isAdmin]);

  const activeCount   = employees.filter(e => e.status === 'active').length;
  const inactiveCount = employees.filter(e => e.status === 'inactive').length;

  const companyMap = new Map(companies.map(c => [c.id, c.name]));
  const deptMap    = new Map(departments.map(d => [d.id, d.name]));

  const recentEmployees = [...employees]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3B55]">
            Welcome back, <span className="text-[#22C55E]">{user?.email}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{dateStr} · {timeStr}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 self-start">
          <LayoutDashboard className="w-4 h-4 text-[#22C55E]" />
          <span className="text-sm font-semibold text-[#2D3B55]">Overview</span>
        </div>
      </div>

      {/* ── Stats Row 1 ──────────────────────────────────────────────── */}
      <div className={['grid gap-4', isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'].join(' ')}>
        {loading
          ? Array.from({ length: isAdmin ? 4 : 3 }).map((_, i) => <StatSkeleton key={i} />)
          : <>
              {isAdmin && <StatCard label="Total Companies"  value={companies.length}   icon={Building2}  bg="bg-blue-50"    iconCls="text-blue-500" />}
              <StatCard label="Total Departments" value={departments.length}  icon={LayoutGrid} bg="bg-emerald-50" iconCls="text-emerald-500" />
              <StatCard label="Total Employees"   value={employees.length}   icon={Users}      bg="bg-violet-50"  iconCls="text-violet-500" />
              <StatCard label="Active Employees"  value={activeCount}        icon={UserCheck}  bg="bg-green-50"   iconCls="text-green-500" />
            </>
        }
      </div>

      {/* ── Stats Row 2 ──────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {loading
          ? Array.from({ length: isAdmin ? 2 : 1 }).map((_, i) => <StatSkeleton key={i} />)
          : <>
              <StatCard label="Inactive Employees" value={inactiveCount}      icon={UserX}      bg="bg-red-50"   iconCls="text-red-400" />
              {isAdmin && <StatCard label="HR Managers" value={hrManagers.length} icon={ShieldCheck} bg="bg-amber-50" iconCls="text-amber-500" />}
            </>
        }
      </div>

      {/* ── Recent Employees ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#22C55E]" />
          <h2 className="font-semibold text-[#2D3B55]">Recent Employees</h2>
          <span className="ml-auto text-xs text-gray-400 font-medium">Last 5 added</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500">
                {['Name', 'Title', 'Department', 'Company', 'Status', 'Days Employed'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <TableSkeletonRow key={i} cols={6} widths={['w-36','w-28','w-24','w-32','w-16','w-14']} />)
                : recentEmployees.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No employees found.</td></tr>
                  : recentEmployees.map(emp => (
                      <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#2D3B55] flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[10px] font-bold leading-none">{getInitials(emp.name)}</span>
                            </div>
                            <span className="font-medium text-[#2D3B55]">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-500">{emp.title}</td>
                        <td className="px-4 py-4 text-gray-500">{deptMap.get(emp.department_id) ?? '—'}</td>
                        <td className="px-4 py-4 text-gray-500">{companyMap.get(emp.company_id) ?? '—'}</td>
                        <td className="px-4 py-4">
                          <span className={['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
                            emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600',
                          ].join(' ')}>
                            {emp.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-500 tabular-nums">{emp.days_employed}d</td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Department Overview ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-[#22C55E]" />
          <h2 className="font-semibold text-[#2D3B55]">Department Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse space-y-3">
                  <div className="h-5 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-5 w-20 bg-gray-100 rounded" />
                </div>
              ))
            : departments.length === 0
              ? <div className="col-span-full py-12 text-center text-gray-400 text-sm">No departments found.</div>
              : departments.map(dept => (
                  <div key={dept.id}
                    className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 pr-2">
                        <h3 className="font-semibold text-[#2D3B55] truncate">{dept.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{companyMap.get(dept.company_id) ?? '—'}</span>
                        </p>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <LayoutGrid className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="font-semibold text-[#2D3B55] tabular-nums">{dept.active_employee_count}</span>
                      <span className="text-gray-500">active</span>
                    </div>
                  </div>
                ))
          }
        </div>
      </div>

    </div>
  );
}
