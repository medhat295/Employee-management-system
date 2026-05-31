import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, LayoutGrid,
  X, Loader2, Building2, Users,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Company, Department } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  const widths = ['w-2/5', 'w-1/5', 'w-1/6', 'w-1/5', 'w-1/6'];
  return (
    <tr className="border-b border-gray-100">
      {widths.slice(0, cols).map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-4 bg-gray-100 rounded-lg animate-pulse ${w}`} />
        </td>
      ))}
    </tr>
  );
}

// ── Add / Edit modal ─────────────────────────────────────────────────────────

interface DeptForm {
  name: string;
  company: number;
}

interface ModalProps {
  department?: Department;
  companies: Company[];
  defaultCompanyId?: number;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function DepartmentModal({
  department, companies, defaultCompanyId, isAdmin, onClose, onSuccess,
}: ModalProps) {
  const isEdit = !!department;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeptForm>({
    defaultValues: {
      name: department?.name ?? '',
      company: department?.company_id ?? defaultCompanyId ?? (companies[0]?.id ?? 0),
    },
  });

  const onSubmit = async ({ name, company }: DeptForm) => {
    try {
      if (isEdit) {
        await api.patch(`/departments/${department.id}/`, { name, company });
        toast.success('Department updated successfully');
      } else {
        await api.post('/departments/', { name, company });
        toast.success('Department created successfully');
      }
      onSuccess();
    } catch {
      // axios interceptor shows error toast
    }
  };

  const inputCls = (hasError: boolean) =>
    [
      'w-full h-11 px-4 rounded-xl border text-sm text-gray-900',
      'placeholder:text-gray-400 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]',
      hasError
        ? 'border-red-400 bg-red-50/50'
        : 'border-gray-200 bg-gray-50 hover:border-gray-300',
    ].join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2D3B55]/10 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-[#2D3B55]" />
            </div>
            <h2 className="text-base font-semibold text-[#2D3B55]">
              {isEdit ? 'Edit Department' : 'Add Department'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

          {/* Company select — admin only */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company <span className="text-red-500">*</span>
              </label>
              <select
                className={inputCls(!!errors.company)}
                {...register('company', {
                  required: 'Company is required',
                  valueAsNumber: true,
                })}
              >
                <option value="">Select a company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.company && (
                <p className="mt-1.5 text-xs text-red-500">{errors.company.message}</p>
              )}
            </div>
          )}

          {/* Department name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Engineering"
              autoFocus
              className={inputCls(!!errors.name)}
              {...register('name', {
                required: 'Department name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium
                text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-[#2D3B55] hover:bg-[#22C55E] text-white
                text-sm font-semibold transition-all duration-200
                flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : isEdit ? 'Save Changes' : 'Add Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────

interface DeleteProps {
  department: Department;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteConfirm({ department, companyName, onClose, onSuccess }: DeleteProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/departments/${department.id}/`);
      toast.success(`"${department.name}" deleted`);
      onSuccess();
    } catch {
      // axios interceptor shows error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Delete Department</h2>
            <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Are you sure you want to delete{' '}
          <strong className="text-gray-900">"{department.name}"</strong>
          {companyName ? <> from <strong className="text-gray-900">{companyName}</strong></> : ''}?
          All employees in this department will be affected.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium
              text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white
              text-sm font-semibold transition-colors flex items-center justify-center gap-2
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
              : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function DepartmentsPage() {
  const { isAdmin, user } = useAuth();

  const [departments, setDepartments]   = useState<Department[]>([]);
  const [companies, setCompanies]       = useState<Company[]>([]);
  const [loading, setLoading]           = useState(true);
  const [addOpen, setAddOpen]           = useState(false);
  const [editTarget, setEditTarget]     = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  // company_id → name lookup (admin only; HR managers have one company)
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const requests: [Promise<{ data: Department[] }>, Promise<{ data: Company[] }> | null] = [
        api.get<Department[]>('/departments/'),
        isAdmin ? api.get<Company[]>('/companies/') : null,
      ];
      const [deptRes, compRes] = await Promise.all(requests);
      setDepartments(deptRes.data);
      if (compRes) setCompanies(compRes.data);
    } catch {
      // axios interceptor shows error toast
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSuccess = () => {
    setAddOpen(false);
    setEditTarget(null);
    setDeleteTarget(null);
    fetchData();
  };

  const totalActiveEmployees = departments.reduce(
    (s, d) => s + d.active_employee_count, 0,
  );

  // Show company column only for admin (HR manager sees only their own company)
  const showCompanyCol = isAdmin;
  const tableColCount  = showCompanyCol ? 5 : 4;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading
            ? 'Loading…'
            : `${departments.length} ${departments.length === 1 ? 'department' : 'departments'}`}
        </p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 h-10 px-5 rounded-xl
            bg-[#2D3B55] hover:bg-[#22C55E] text-white text-sm font-semibold
            transition-all duration-200 shadow-sm hover:shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            icon: LayoutGrid, label: 'Total Departments',
            value: loading ? null : departments.length,
            iconBg: 'bg-[#2D3B55]/10', iconColor: 'text-[#2D3B55]',
          },
          {
            icon: Users, label: 'Total Active Employees',
            value: loading ? null : totalActiveEmployees,
            iconBg: 'bg-[#22C55E]/10', iconColor: 'text-[#22C55E]',
          },
        ].map(({ icon: Icon, label, value, iconBg, iconColor }) => (
          <div key={label}
            className="bg-white rounded-2xl border border-gray-200 px-5 py-4
              flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2D3B55] leading-none">
                {value === null
                  ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
                  : value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Department
              </th>
              {showCompanyCol && (
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Company
                </th>
              )}
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Active Employees
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Created
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <SkeletonRow key={i} cols={tableColCount} />
              ))
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={tableColCount} className="py-16 text-center">
                  <LayoutGrid className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">No departments yet</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Click "Add Department" to get started
                  </p>
                </td>
              </tr>
            ) : (
              departments.map((dept) => {
                const companyName = companyMap.get(dept.company_id) ?? '—';
                return (
                  <tr
                    key={dept.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Department name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#2D3B55]/10
                          flex items-center justify-center flex-shrink-0">
                          <LayoutGrid className="w-4 h-4 text-[#2D3B55]" />
                        </div>
                        <span className="font-medium text-gray-900">{dept.name}</span>
                      </div>
                    </td>

                    {/* Company (admin only) */}
                    {showCompanyCol && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {companyName}
                        </div>
                      </td>
                    )}

                    {/* Active employees */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        text-xs font-semibold bg-[#22C55E]/10 text-[#16a34a]">
                        <Users className="w-3 h-3" />
                        {dept.active_employee_count}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-5 py-4 text-gray-500">
                      {formatDate(dept.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditTarget(dept)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-gray-400
                            hover:bg-[#2D3B55]/10 hover:text-[#2D3B55] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(dept)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-gray-400
                            hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {addOpen && (
        <DepartmentModal
          companies={companies}
          defaultCompanyId={user?.company_id ?? undefined}
          isAdmin={isAdmin}
          onClose={() => setAddOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
      {editTarget && (
        <DepartmentModal
          department={editTarget}
          companies={companies}
          defaultCompanyId={user?.company_id ?? undefined}
          isAdmin={isAdmin}
          onClose={() => setEditTarget(null)}
          onSuccess={handleSuccess}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          department={deleteTarget}
          companyName={companyMap.get(deleteTarget.company_id) ?? ''}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleSuccess}
        />
      )}

    </div>
  );
}
