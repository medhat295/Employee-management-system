import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Users, Building2, LayoutGrid, Clock, ShieldCheck, UserCheck, Briefcase, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Company, Department, Employee, User } from '../types';
import { formatTenure, getInitials, avatarColor } from '../utils/format';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { InlineStatCard } from '../components/ui/InlineStatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActionButtons } from '../components/ui/ActionButtons';
import { TableSkeletonRow } from '../components/ui/TableSkeleton';
import { EmptyTableState } from '../components/ui/EmptyTableState';
import { EmployeeFormModal } from '../components/employees/EmployeeFormModal';
import { HRManagerFormModal } from '../components/employees/HRManagerFormModal';
import { TransitionModal } from '../components/employees/TransitionModal';
import { ViewEmployeeModal } from '../components/employees/ViewEmployeeModal';
import { ONBOARDING_BADGE } from '../components/employees/onboardingConfig';

type TabId = 'employees' | 'hr_managers';

export function EmployeesPage() {
  const { isAdmin, user } = useAuth();

  const [activeTab, setActiveTab]               = useState<TabId>('employees');
  const [employees, setEmployees]               = useState<Employee[]>([]);
  const [companies, setCompanies]               = useState<Company[]>([]);
  const [departments, setDepartments]           = useState<Department[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [addOpen, setAddOpen]                   = useState(false);
  const [viewTarget, setViewTarget]             = useState<Employee | null>(null);
  const [editTarget, setEditTarget]             = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget]         = useState<Employee | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<Employee | null>(null);
  const [hrManagers, setHRManagers]             = useState<User[]>([]);
  const [hrLoading, setHRLoading]               = useState(false);
  const [addHROpen, setAddHROpen]               = useState(false);

  const deptMap    = new Map(departments.map((d) => [d.id, d.name]));
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, compRes] = await Promise.all([
        api.get<Employee[]>('/employees/'),
        api.get<Department[]>('/departments/'),
        api.get<Company[]>('/companies/'),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setCompanies(compRes.data);
    } catch { /* axios interceptor shows error toast */ } finally { setLoading(false); }
  }, []);

  const fetchHRManagers = useCallback(async () => {
    if (!isAdmin) return;
    setHRLoading(true);
    try {
      const res = await api.get<User[]>('/accounts/users/?role=hr_manager');
      setHRManagers(res.data);
    } catch { /* axios interceptor shows error toast */ } finally { setHRLoading(false); }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (activeTab === 'hr_managers') fetchHRManagers(); }, [activeTab, fetchHRManagers]);

  const handleSuccess = () => { setAddOpen(false); setEditTarget(null); setDeleteTarget(null); fetchData(); };
  const handleHRSuccess = () => { setAddHROpen(false); fetchHRManagers(); };
  const handleTransitioned = (updated: Employee) =>
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));

  const active   = employees.filter((e) => e.status === 'active').length;
  const inactive = employees.filter((e) => e.status === 'inactive').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Tabs + action button ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {([
            { id: 'employees'   as TabId, label: 'Employees',   icon: Users },
            ...(isAdmin ? [{ id: 'hr_managers' as TabId, label: 'HR Managers', icon: ShieldCheck }] : []),
          ]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={['flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                activeTab === id ? 'bg-white text-[#2D3B55] shadow-sm' : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
        {activeTab === 'employees' ? (
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#2D3B55] hover:bg-[#22C55E]
              text-white text-sm font-semibold transition-all duration-200 shadow-sm
              hover:shadow-[0_4px_14px_rgba(34,197,94,0.3)]">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        ) : isAdmin ? (
          <button onClick={() => setAddHROpen(true)}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#2D3B55] hover:bg-[#22C55E]
              text-white text-sm font-semibold transition-all duration-200 shadow-sm
              hover:shadow-[0_4px_14px_rgba(34,197,94,0.3)]">
            <Plus className="w-4 h-4" /> Add HR Manager
          </button>
        ) : null}
      </div>

      {/* ── Employees tab ────────────────────────────────────────────── */}
      {activeTab === 'employees' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InlineStatCard icon={Users}     label="Total Employees" value={loading ? null : employees.length} iconBg="bg-[#2D3B55]/10" iconColor="text-[#2D3B55]" />
            <InlineStatCard icon={UserCheck} label="Active"          value={loading ? null : active}           iconBg="bg-[#22C55E]/10" iconColor="text-[#22C55E]" />
            <InlineStatCard icon={Briefcase} label="Inactive"        value={loading ? null : inactive}         iconBg="bg-gray-200/60"  iconColor="text-gray-400" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {[['Employee','text-left'],['Email','text-left'],['Mobile','text-left'],['Title','text-left'],
                      ['Department','text-left'],['Status','text-left'],['Onboarding','text-left'],['Tenure','text-left'],['Actions','text-right'],
                    ].map(([h, align]) => (
                      <th key={h} className={`px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${align}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => <TableSkeletonRow key={i} cols={9} />)
                  ) : employees.length === 0 ? (
                    <EmptyTableState icon={Users} message="No employees yet" hint='Click "Add Employee" to get started' colSpan={9} />
                  ) : employees.map((emp) => {
                    const color    = avatarColor(emp.name);
                    const deptName = deptMap.get(emp.department_id) ?? '—';
                    const badge    = ONBOARDING_BADGE[emp.onboarding_status];
                    return (
                      <tr key={emp.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white text-xs font-bold">{getInitials(emp.name)}</span>
                            </div>
                            <span className="font-medium text-gray-900 whitespace-nowrap">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 max-w-[180px] truncate">{emp.email}</td>
                        <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{emp.mobile}</td>
                        <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{emp.title}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <LayoutGrid className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 whitespace-nowrap">{deptName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={emp.status} /></td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => setTransitionTarget(emp)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-75 ${badge.cls}`}>
                            {badge.label}<ChevronRight className="w-3 h-3 opacity-50" />
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {formatTenure(emp.days_employed)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <ActionButtons
                            onView={() => setViewTarget(emp)}
                            onEdit={() => setEditTarget(emp)}
                            onDelete={() => setDeleteTarget(emp)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── HR Managers tab ──────────────────────────────────────────── */}
      {activeTab === 'hr_managers' && isAdmin && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InlineStatCard icon={ShieldCheck} label="Total HR Managers" value={hrLoading ? null : hrManagers.length} iconBg="bg-sky-500/10" iconColor="text-sky-600" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {[['Email','text-left'],['Company','text-left'],['Role','text-left']].map(([h, align]) => (
                      <th key={h} className={`px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${align}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hrLoading ? (
                    [...Array(4)].map((_, i) => <TableSkeletonRow key={i} cols={3} />)
                  ) : hrManagers.length === 0 ? (
                    <EmptyTableState icon={ShieldCheck} message="No HR managers yet" hint='Click "Add HR Manager" to get started' colSpan={3} />
                  ) : hrManagers.map((mgr) => (
                    <tr key={mgr.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{mgr.email[0].toUpperCase()}</span>
                          </div>
                          <span className="text-gray-700">{mgr.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">{mgr.company_id ? companyMap.get(mgr.company_id) ?? '—' : '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">HR Manager</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {viewTarget && (
        <ViewEmployeeModal employee={viewTarget} deptMap={deptMap} companyMap={companyMap} onClose={() => setViewTarget(null)} />
      )}
      {(addOpen || editTarget) && (
        <EmployeeFormModal
          employee={editTarget ?? undefined}
          companies={companies} departments={departments} isAdmin={isAdmin}
          defaultCompanyId={user?.company_id ?? undefined}
          onClose={() => { setAddOpen(false); setEditTarget(null); }}
          onSuccess={handleSuccess}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Remove Employee"
          description={<>Are you sure you want to remove <strong className="text-gray-900">"{deleteTarget.name}"</strong>? Their account and all associated records will be permanently deleted.</>}
          confirmLabel="Remove" loadingLabel="Removing…"
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => { await api.delete(`/employees/${deleteTarget.id}/`); toast.success(`"${deleteTarget.name}" removed`); handleSuccess(); }}
        />
      )}
      {addHROpen && (
        <HRManagerFormModal companies={companies} onClose={() => setAddHROpen(false)} onSuccess={handleHRSuccess} />
      )}
      {transitionTarget && (
        <TransitionModal employee={transitionTarget} onClose={() => setTransitionTarget(null)} onTransitioned={handleTransitioned} />
      )}

    </div>
  );
}
