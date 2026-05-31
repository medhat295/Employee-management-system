import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Building2, LayoutGrid, Users } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Company } from '../types';
import { formatDate } from '../utils/format';
import { Modal, ModalHeader, ModalFooter } from '../components/ui/Modal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { InlineStatCard } from '../components/ui/InlineStatCard';
import { ActionButtons } from '../components/ui/ActionButtons';
import { TableSkeletonRow } from '../components/ui/TableSkeleton';
import { EmptyTableState } from '../components/ui/EmptyTableState';

// ── Add / Edit modal ─────────────────────────────────────────────────────────

interface CompanyForm { name: string }

interface ModalProps {
  company?: Company;
  onClose: () => void;
  onSuccess: () => void;
}

function CompanyModal({ company, onClose, onSuccess }: ModalProps) {
  const isEdit = !!company;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyForm>({
    defaultValues: { name: company?.name ?? '' },
  });

  const onSubmit = async ({ name }: CompanyForm) => {
    try {
      if (isEdit) {
        await api.patch(`/companies/${company.id}/`, { name });
        toast.success('Company updated successfully');
      } else {
        await api.post('/companies/', { name });
        toast.success('Company created successfully');
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
        title={isEdit ? 'Edit Company' : 'Add Company'}
        icon={<Building2 className="w-4 h-4 text-[#2D3B55]" />}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Corporation"
              autoFocus
              className={inputCls(!!errors.name)}
              {...register('name', {
                required: 'Company name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
          </div>
        </div>
        <ModalFooter
          onCancel={onClose}
          submitLabel={isEdit ? 'Save Changes' : 'Add Company'}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function CompaniesPage() {
  const { isAdmin } = useAuth();
  const [companies, setCompanies]           = useState<Company[]>([]);
  const [loading, setLoading]               = useState(true);
  const [addOpen, setAddOpen]               = useState(false);
  const [editTarget, setEditTarget]         = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<Company | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Company[]>('/companies/');
      setCompanies(data);
    } catch {
      // axios interceptor shows error toast
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleSuccess = () => {
    setAddOpen(false);
    setEditTarget(null);
    setDeleteTarget(null);
    fetchCompanies();
  };

  const totalDepts = companies.reduce((s, c) => s + c.total_departments, 0);
  const totalEmps  = companies.reduce((s, c) => s + c.total_employees, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading…' : `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} registered`}
        </p>
        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 h-10 px-5 rounded-xl
              bg-[#2D3B55] hover:bg-[#22C55E] text-white text-sm font-semibold
              transition-all duration-200 shadow-sm hover:shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        )}
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InlineStatCard icon={Building2} label="Total Companies"   value={loading ? null : companies.length} iconBg="bg-[#2D3B55]/10" iconColor="text-[#2D3B55]" />
        <InlineStatCard icon={LayoutGrid} label="Total Departments" value={loading ? null : totalDepts}       iconBg="bg-[#22C55E]/10" iconColor="text-[#22C55E]" />
        <InlineStatCard icon={Users}      label="Total Employees"   value={loading ? null : totalEmps}        iconBg="bg-sky-500/10"    iconColor="text-sky-500" />
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {['Company Name', 'Departments', 'Employees', 'Created', ...(isAdmin ? ['Actions'] : [])].map((h, i) => (
                <th
                  key={h}
                  className={[
                    'px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide',
                    i === 4 ? 'text-right' : 'text-left',
                  ].join(' ')}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableSkeletonRow key={i} cols={isAdmin ? 5 : 4} widths={['w-2/5', 'w-1/6', 'w-1/6', 'w-1/5', 'w-1/6']} />
              ))
            ) : companies.length === 0 ? (
              <EmptyTableState
                icon={Building2}
                message="No companies yet"
                hint={isAdmin ? 'Click "Add Company" to get started' : undefined}
                colSpan={isAdmin ? 5 : 4}
              />
            ) : (
              companies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2D3B55]/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[#2D3B55]" />
                      </div>
                      <span className="font-medium text-gray-900">{company.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2D3B55]/[0.08] text-[#2D3B55]">
                      {company.total_departments}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#22C55E]/10 text-[#16a34a]">
                      {company.total_employees}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{formatDate(company.created_at)}</td>
                  {isAdmin && (
                    <td className="px-5 py-4">
                      <ActionButtons
                        onEdit={() => setEditTarget(company)}
                        onDelete={() => setDeleteTarget(company)}
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {addOpen && (
        <CompanyModal onClose={() => setAddOpen(false)} onSuccess={handleSuccess} />
      )}
      {editTarget && (
        <CompanyModal company={editTarget} onClose={() => setEditTarget(null)} onSuccess={handleSuccess} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Company"
          description={
            <>
              Are you sure you want to delete{' '}
              <strong className="text-gray-900 font-semibold">"{deleteTarget.name}"</strong>?
              All associated departments and employees will also be removed.
            </>
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await api.delete(`/companies/${deleteTarget.id}/`);
            toast.success(`"${deleteTarget.name}" deleted`);
            handleSuccess();
          }}
        />
      )}

    </div>
  );
}
