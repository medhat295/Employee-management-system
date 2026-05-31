import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Building2,
  X, Loader2, LayoutGrid, Users,
} from 'lucide-react';
import api from '../api/axios';
import type { Company } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {['w-2/5', 'w-1/6', 'w-1/6', 'w-1/5', 'w-1/6'].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-4 bg-gray-100 rounded-lg animate-pulse ${w}`} />
        </td>
      ))}
    </tr>
  );
}

// ── Add / Edit modal ─────────────────────────────────────────────────────────

interface CompanyForm { name: string }

interface ModalProps {
  company?: Company;
  onClose: () => void;
  onSuccess: () => void;
}

function CompanyModal({ company, onClose, onSuccess }: ModalProps) {
  const isEdit = !!company;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyForm>({
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
      // axios interceptor already shows error toast
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2D3B55]/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#2D3B55]" />
            </div>
            <h2 className="text-base font-semibold text-[#2D3B55]">
              {isEdit ? 'Edit Company' : 'Add Company'}
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
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Corporation"
              autoFocus
              className={[
                'w-full h-11 px-4 rounded-xl border text-sm text-gray-900',
                'placeholder:text-gray-400 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]',
                errors.name
                  ? 'border-red-400 bg-red-50/50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300',
              ].join(' ')}
              {...register('name', {
                required: 'Company name is required',
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
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                isEdit ? 'Save Changes' : 'Add Company'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────

interface DeleteProps {
  company: Company;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteConfirm({ company, onClose, onSuccess }: DeleteProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/companies/${company.id}/`);
      toast.success(`"${company.name}" deleted`);
      onSuccess();
    } catch {
      // axios interceptor already shows error toast
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
            <h2 className="text-base font-semibold text-gray-900">Delete Company</h2>
            <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Are you sure you want to delete{' '}
          <strong className="text-gray-900 font-semibold">"{company.name}"</strong>?
          All associated departments and employees will also be removed.
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

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(true);
  const [addOpen, setAddOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

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

  const totalDepts  = companies.reduce((s, c) => s + c.total_departments, 0);
  const totalEmps   = companies.reduce((s, c) => s + c.total_employees,   0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading…' : `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} registered`}
        </p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 h-10 px-5 rounded-xl
            bg-[#2D3B55] hover:bg-[#22C55E] text-white text-sm font-semibold
            transition-all duration-200 shadow-sm hover:shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Building2, label: 'Total Companies',
            value: loading ? null : companies.length,
            iconBg: 'bg-[#2D3B55]/10', iconColor: 'text-[#2D3B55]',
          },
          {
            icon: LayoutGrid, label: 'Total Departments',
            value: loading ? null : totalDepts,
            iconBg: 'bg-[#22C55E]/10', iconColor: 'text-[#22C55E]',
          },
          {
            icon: Users, label: 'Total Employees',
            value: loading ? null : totalEmps,
            iconBg: 'bg-sky-500/10', iconColor: 'text-sky-500',
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

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              {['Company Name', 'Departments', 'Employees', 'Created', 'Actions'].map((h, i) => (
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
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">No companies yet</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Click "Add Company" to get started
                  </p>
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
                >
                  {/* Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2D3B55]/10
                        flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[#2D3B55]" />
                      </div>
                      <span className="font-medium text-gray-900">{company.name}</span>
                    </div>
                  </td>

                  {/* Departments */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full
                      text-xs font-semibold bg-[#2D3B55]/[0.08] text-[#2D3B55]">
                      {company.total_departments}
                    </span>
                  </td>

                  {/* Employees */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full
                      text-xs font-semibold bg-[#22C55E]/10 text-[#16a34a]">
                      {company.total_employees}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-5 py-4 text-gray-500">
                    {formatDate(company.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditTarget(company)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-gray-400
                          hover:bg-[#2D3B55]/10 hover:text-[#2D3B55]
                          transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(company)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400
                          hover:bg-red-50 hover:text-red-500
                          transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      {addOpen && (
        <CompanyModal
          onClose={() => setAddOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
      {editTarget && (
        <CompanyModal
          company={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={handleSuccess}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          company={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleSuccess}
        />
      )}

    </div>
  );
}
