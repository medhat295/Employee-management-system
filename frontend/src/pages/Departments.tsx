import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, LayoutGrid, Building2, Users } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Company, Department } from '../types';
import { formatDate } from '../utils/format';
import { Modal, ModalHeader, ModalFooter } from '../components/ui/Modal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { InlineStatCard } from '../components/ui/InlineStatCard';
import { ActionButtons } from '../components/ui/ActionButtons';
import { TableSkeletonRow } from '../components/ui/TableSkeleton';
import { EmptyTableState } from '../components/ui/EmptyTableState';

// ── Add / Edit modal ─────────────────────────────────────────────────────────

interface DeptForm {
  name: string;
  company: number;
}

interface DeptModalProps {
  department?: Department;
  companies: Company[];
  defaultCompanyId?: number;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function DepartmentModal({
  department, companies, defaultCompanyId, isAdmin, onClose, onSuccess,
}: DeptModalProps) {
  const isEdit = !!department;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DeptForm>({
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

  const inputCls = (hasError: boolean) => [
    'w-full h-11 px-4 rounded-xl border text-sm text-gray-900',
    'placeholder:text-gray-400 transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]',
    hasError ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300',
  ].join(' ');

  return (
    <Modal maxWidth="md">
      <ModalHeader
        title={isEdit ? 'Edit Department' : 'Add Department'}
        icon={<LayoutGrid className="w-4 h-4 text-[#2D3B55]" />}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-6 py-5 space-y-4">

          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company <span className="text-red-500">*</span>
              </label>
              <select
                className={inputCls(!!errors.company)}
                {...register('company', { required: 'Company is required', valueAsNumber: true })}
              >
                <option value="">Select a company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.company && <p className="mt-1.5 text-xs text-red-500">{errors.company.message}</p>}
            </div>
          )}

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
            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
          </div>

        </div>
        <ModalFooter
          onCancel={onClose}
          submitLabel={isEdit ? 'Save Changes' : 'Add Department'}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
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

  const totalActiveEmployees = departments.reduce((s, d) => s + d.active_employee_count, 0);
  const tableColCount = isAdmin ? 5 : 4;

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
        <InlineStatCard icon={LayoutGrid} label="Total Departments"      value={loading ? null : departments.length}        iconBg="bg-[#2D3B55]/10" iconColor="text-[#2D3B55]" />
        <InlineStatCard icon={Users}      label="Total Active Employees" value={loading ? null : totalActiveEmployees}       iconBg="bg-[#22C55E]/10" iconColor="text-[#22C55E]" />
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
              {isAdmin && <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>}
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Employees</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <TableSkeletonRow key={i} cols={tableColCount} />)
            ) : departments.length === 0 ? (
              <EmptyTableState
                icon={LayoutGrid}
                message="No departments yet"
                hint='Click "Add Department" to get started'
                colSpan={tableColCount}
              />
            ) : (
              departments.map((dept) => {
                const companyName = companyMap.get(dept.company_id) ?? '—';
                return (
                  <tr
                    key={dept.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#2D3B55]/10 flex items-center justify-center flex-shrink-0">
                          <LayoutGrid className="w-4 h-4 text-[#2D3B55]" />
                        </div>
                        <span className="font-medium text-gray-900">{dept.name}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {companyName}
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#22C55E]/10 text-[#16a34a]">
                        <Users className="w-3 h-3" />
                        {dept.active_employee_count}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(dept.created_at)}</td>
                    <td className="px-5 py-4">
                      <ActionButtons
                        onEdit={() => setEditTarget(dept)}
                        onDelete={() => setDeleteTarget(dept)}
                      />
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
        <DeleteConfirmModal
          title="Delete Department"
          description={
            <>
              Are you sure you want to delete{' '}
              <strong className="text-gray-900">"{deleteTarget.name}"</strong>
              {companyMap.get(deleteTarget.company_id)
                ? <> from <strong className="text-gray-900">{companyMap.get(deleteTarget.company_id)}</strong></>
                : ''}?
              All employees in this department will be affected.
            </>
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await api.delete(`/departments/${deleteTarget.id}/`);
            toast.success(`"${deleteTarget.name}" deleted`);
            handleSuccess();
          }}
        />
      )}

    </div>
  );
}
