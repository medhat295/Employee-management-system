import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Users, X, Loader2, Eye,
  Mail, Phone, MapPin, Briefcase, Calendar,
  Building2, LayoutGrid, Clock, UserCheck, ShieldCheck, ChevronRight,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Company, Department, Employee, OnboardingStatus, User } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDaysEmployed(days: number): string {
  if (days < 30)  return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return m ? `${y}y ${m}mo` : `${y}y`;
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_PALETTE = [
  'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-indigo-500',
];
function avatarColor(name: string) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({ cols = 8 }: { cols?: number }) {
  const widths = ['w-44', 'w-40', 'w-28', 'w-32', 'w-24', 'w-20', 'w-16', 'w-16'];
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className={`h-4 bg-gray-100 rounded-lg animate-pulse ${widths[i] ?? 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

// ── Onboarding state machine ─────────────────────────────────────────────────

const ONBOARDING_BADGE: Record<OnboardingStatus, { label: string; cls: string }> = {
  application_received: { label: 'Applied',      cls: 'bg-gray-100 text-gray-600' },
  interview_scheduled:  { label: 'Interview',    cls: 'bg-blue-100 text-blue-700' },
  hired:                { label: 'Hired',        cls: 'bg-emerald-100 text-emerald-700' },
  not_accepted:         { label: 'Not Accepted', cls: 'bg-red-100 text-red-600' },
};

const NEXT_TRANSITIONS: Record<OnboardingStatus, { value: OnboardingStatus; label: string }[]> = {
  application_received: [
    { value: 'interview_scheduled', label: 'Schedule Interview' },
    { value: 'not_accepted',        label: 'Mark Not Accepted' },
  ],
  interview_scheduled: [
    { value: 'hired',        label: 'Hire' },
    { value: 'not_accepted', label: 'Mark Not Accepted' },
  ],
  hired: [
    { value: 'not_accepted', label: 'Rescind Offer' },
  ],
  not_accepted: [
    { value: 'application_received', label: 'Reconsider' },
  ],
};

// ── Transition modal ──────────────────────────────────────────────────────────

interface TransitionModalProps {
  employee: Employee;
  onClose: () => void;
  onTransitioned: (updated: Employee) => void;
}

function TransitionModal({ employee, onClose, onTransitioned }: TransitionModalProps) {
  const [loading, setLoading] = useState<OnboardingStatus | null>(null);

  const badge     = ONBOARDING_BADGE[employee.onboarding_status];
  const nextSteps = NEXT_TRANSITIONS[employee.onboarding_status];
  const color     = avatarColor(employee.name);

  const handleTransition = async (target: OnboardingStatus) => {
    setLoading(target);
    try {
      const { data } = await api.post<Employee>(
        `/employees/${employee.id}/transition/`,
        { onboarding_status: target },
      );
      toast.success(`Moved to: ${ONBOARDING_BADGE[target].label}`);
      onTransitioned(data);
      onClose();
    } catch {
      // axios interceptor shows error toast
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#2D3B55]">Move to Next Stage</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Employee info */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-sm font-bold">{getInitials(employee.name)}</span>
            </div>
            <div>
              <p className="font-semibold text-[#2D3B55]">{employee.name}</p>
              <p className="text-xs text-gray-500">{employee.title}</p>
            </div>
          </div>

          {/* Current stage */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Current stage</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          {/* Options */}
          {nextSteps.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              This is a final state — no further transitions allowed.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Move to</p>
              {nextSteps.map((step) => {
                const stepBadge = ONBOARDING_BADGE[step.value];
                const isLoading = loading === step.value;
                return (
                  <button
                    key={step.value}
                    onClick={() => handleTransition(step.value)}
                    disabled={!!loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2
                      border-gray-100 hover:border-[#22C55E]/50 hover:bg-emerald-50/40
                      transition-all text-left group
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stepBadge.cls.split(' ')[0]}`} />
                    <span className="flex-1 text-sm font-medium text-gray-700">{step.label}</span>
                    {isLoading
                      ? <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#22C55E] transition-colors flex-shrink-0" />
                    }
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose}
            className="w-full h-10 rounded-xl border border-gray-200 text-sm font-medium
              text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View modal ────────────────────────────────────────────────────────────────

interface ViewProps {
  employee: Employee;
  deptMap: Map<number, string>;
  companyMap: Map<number, string>;
  onClose: () => void;
}

function ViewModal({ employee, deptMap, companyMap, onClose }: ViewProps) {
  const color = avatarColor(employee.name);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#2D3B55]">Employee Profile</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-xl">{getInitials(employee.name)}</span>
            </div>
            <div>
              <p className="text-lg font-bold text-[#2D3B55]">{employee.name}</p>
              <p className="text-sm text-gray-500">{employee.title}</p>
              <span className={[
                'inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                employee.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {employee.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Days employed highlight */}
          <div className="bg-[#2D3B55]/5 rounded-xl px-4 py-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#2D3B55] flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Time Employed</p>
              <p className="font-bold text-[#2D3B55]">
                {formatDaysEmployed(employee.days_employed)}
                <span className="text-xs font-normal text-gray-500 ml-1.5">
                  (since {formatDate(employee.hire_date)})
                </span>
              </p>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Mail,       label: 'Email',      value: employee.email },
              { icon: Phone,      label: 'Mobile',     value: employee.mobile },
              { icon: LayoutGrid, label: 'Department',  value: deptMap.get(employee.department_id) ?? '—' },
              { icon: Building2,  label: 'Company',     value: companyMap.get(employee.company_id) ?? '—' },
              { icon: Calendar,   label: 'Hire Date',   value: formatDate(employee.hire_date) },
              { icon: MapPin,     label: 'Address',     value: employee.address || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose}
            className="w-full h-10 rounded-xl bg-[#2D3B55] text-white text-sm font-semibold
              hover:bg-[#22C55E] transition-all duration-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Employee modal (add + edit) ───────────────────────────────────────────────

interface BaseForm {
  name: string; email: string; mobile: string; address: string;
  title: string; hire_date: string; status: 'active' | 'inactive';
  company: number; department: number;
}
interface AddForm extends BaseForm { initial_password: string; confirm_password: string }

interface EmpModalProps {
  employee?: Employee;
  companies: Company[];
  departments: Department[];
  isAdmin: boolean;
  defaultCompanyId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

function EmployeeModal({
  employee, companies, departments, isAdmin, defaultCompanyId, onClose, onSuccess,
}: EmpModalProps) {
  const isEdit = !!employee;

  const defaultCompany = employee?.company_id ?? defaultCompanyId ?? companies[0]?.id ?? 0;

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddForm>({
    defaultValues: {
      name:       employee?.name       ?? '',
      email:      employee?.email      ?? '',
      mobile:     employee?.mobile     ?? '',
      address:    employee?.address    ?? '',
      title:      employee?.title      ?? '',
      hire_date:  employee?.hire_date  ?? '',
      status:     employee?.status     ?? 'active',
      company:    defaultCompany,
      department: employee?.department_id ?? 0,
      initial_password:  '',
      confirm_password:  '',
    },
  });

  const watchedCompany  = Number(watch('company'));
  const watchedPassword = watch('initial_password');

  // Reset department whenever the company changes, but skip the very first render
  // so that edit-mode pre-fills are not wiped on mount.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setValue('department', 0);
  }, [watchedCompany, setValue]);

  const filteredDepts = departments.filter(
    (d) => d.company_id === watchedCompany,
  );

  const onSubmit = async (data: AddForm) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirm_password, ...payload } = data;
      if (isEdit) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { initial_password, ...editPayload } = payload;
        await api.patch(`/employees/${employee.id}/`, editPayload);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees/', payload);
        toast.success('Employee created successfully');
      }
      onSuccess();
    } catch {
      // axios interceptor shows error toast
    }
  };

  const fieldCls = (hasError: boolean) =>
    [
      'w-full h-10 px-3 rounded-xl border text-sm text-gray-900',
      'placeholder:text-gray-400 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]',
      hasError
        ? 'border-red-400 bg-red-50/50'
        : 'border-gray-200 bg-gray-50 hover:border-gray-300',
    ].join(' ');

  const Err = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2D3B55]/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-[#2D3B55]" />
            </div>
            <h2 className="text-base font-semibold text-[#2D3B55]">
              {isEdit ? 'Edit Employee' : 'Add Employee'}
            </h2>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Jane Smith"
                  className={fieldCls(!!errors.name)}
                  {...register('name', { required: 'Required' })} />
                <Err msg={errors.name?.message} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" placeholder="jane@company.com"
                  className={fieldCls(!!errors.email)}
                  {...register('email', {
                    required: 'Required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                  })} />
                <Err msg={errors.email?.message} />
              </div>
            </div>

            {/* Row 2: Mobile + Address */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Mobile <span className="text-red-500">*</span>
                </label>
                <input type="tel" placeholder="+1 555 000 0000"
                  className={fieldCls(!!errors.mobile)}
                  {...register('mobile', { required: 'Required' })} />
                <Err msg={errors.mobile?.message} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input type="text" placeholder="123 Main St"
                  className={fieldCls(false)}
                  {...register('address')} />
              </div>
            </div>

            {/* Row 3: Title + Hire Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Software Engineer"
                  className={fieldCls(!!errors.title)}
                  {...register('title', { required: 'Required' })} />
                <Err msg={errors.title?.message} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hire Date <span className="text-red-500">*</span>
                </label>
                <input type="date"
                  className={fieldCls(!!errors.hire_date)}
                  {...register('hire_date', { required: 'Required' })} />
                <Err msg={errors.hire_date?.message} />
              </div>
            </div>

            {/* Row 4: Status + Company */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select className={fieldCls(false)} {...register('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={!isAdmin}
                  className={[
                    fieldCls(!!errors.company),
                    !isAdmin && 'opacity-70 cursor-not-allowed',
                  ].filter(Boolean).join(' ')}
                  {...register('company', {
                    required: 'Required',
                    valueAsNumber: true,
                    validate: (v) => v > 0 || 'Select a company',
                  })}
                >
                  <option value={0}>Select company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Err msg={errors.company?.message} />
              </div>
            </div>

            {/* Row 5: Department */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                disabled={!watchedCompany}
                className={[
                  fieldCls(!!errors.department),
                  !watchedCompany && 'opacity-70 cursor-not-allowed',
                ].filter(Boolean).join(' ')}
                {...register('department', {
                  required: 'Required',
                  valueAsNumber: true,
                  validate: (v) => v > 0 || 'Select a department',
                })}
              >
                <option value={0}>
                  {watchedCompany ? 'Select department…' : 'Select a company first…'}
                </option>
                {filteredDepts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <Err msg={errors.department?.message} />
            </div>

            {/* Password fields — add only */}
            {!isEdit && (
              <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Initial Password <span className="text-red-500">*</span>
                  </label>
                  <input type="password" placeholder="Min. 8 characters"
                    className={fieldCls(!!errors.initial_password)}
                    {...register('initial_password', {
                      required: 'Required',
                      minLength: { value: 8, message: 'Min 8 characters' },
                    })} />
                  <Err msg={errors.initial_password?.message} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input type="password" placeholder="Repeat password"
                    className={fieldCls(!!errors.confirm_password)}
                    {...register('confirm_password', {
                      required: 'Required',
                      validate: (v) => v === watchedPassword || 'Passwords do not match',
                    })} />
                  <Err msg={errors.confirm_password?.message} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium
                text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-[#2D3B55] hover:bg-[#22C55E] text-white
                text-sm font-semibold transition-all duration-200
                flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : isEdit ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────

interface DeleteProps {
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteConfirm({ employee, onClose, onSuccess }: DeleteProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/employees/${employee.id}/`);
      toast.success(`"${employee.name}" removed`);
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
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Remove Employee</h2>
            <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Are you sure you want to remove{' '}
          <strong className="text-gray-900">"{employee.name}"</strong>?
          Their account and all associated records will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium
              text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white
              text-sm font-semibold transition-colors flex items-center justify-center gap-2
              disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Removing…</> : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HR Manager modal ──────────────────────────────────────────────────────────

interface HRManagerForm {
  email: string;
  password: string;
  confirm_password: string;
  company: number;
}

interface HRManagerModalProps {
  companies: Company[];
  onClose: () => void;
  onSuccess: () => void;
}

function HRManagerModal({ companies, onClose, onSuccess }: HRManagerModalProps) {
  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm<HRManagerForm>({
    defaultValues: { email: '', password: '', confirm_password: '', company: 0 },
  });

  const watchedPassword = watch('password');

  const onSubmit = async (data: HRManagerForm) => {
    try {
      await api.post('/accounts/users/', {
        email: data.email,
        password: data.password,
        company: data.company,
      });
      toast.success('HR Manager created successfully');
      onSuccess();
    } catch {
      // axios interceptor shows error toast
    }
  };

  const fieldCls = (hasError: boolean) =>
    [
      'w-full h-10 px-3 rounded-xl border text-sm text-gray-900',
      'placeholder:text-gray-400 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]',
      hasError
        ? 'border-red-400 bg-red-50/50'
        : 'border-gray-200 bg-gray-50 hover:border-gray-300',
    ].join(' ');

  const Err = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
            </div>
            <h2 className="text-base font-semibold text-[#2D3B55]">Add HR Manager</h2>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" placeholder="hr@company.com"
                className={fieldCls(!!errors.email)}
                {...register('email', {
                  required: 'Required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })} />
              <Err msg={errors.email?.message} />
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <select className={fieldCls(!!errors.company)}
                {...register('company', {
                  required: 'Required',
                  valueAsNumber: true,
                  validate: (v) => v > 0 || 'Select a company',
                })}>
                <option value={0}>Select company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Err msg={errors.company?.message} />
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input type="password" placeholder="Min. 8 characters"
                  className={fieldCls(!!errors.password)}
                  {...register('password', {
                    required: 'Required',
                    minLength: { value: 8, message: 'Min 8 characters' },
                  })} />
                <Err msg={errors.password?.message} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input type="password" placeholder="Repeat password"
                  className={fieldCls(!!errors.confirm_password)}
                  {...register('confirm_password', {
                    required: 'Required',
                    validate: (v) => v === watchedPassword || 'Passwords do not match',
                  })} />
                <Err msg={errors.confirm_password?.message} />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium
                text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-[#2D3B55] hover:bg-[#22C55E] text-white
                text-sm font-semibold transition-all duration-200
                flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                : 'Add HR Manager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type TabId = 'employees' | 'hr_managers';

export function EmployeesPage() {
  const { isAdmin, user } = useAuth();

  // Tab
  const [activeTab, setActiveTab] = useState<TabId>('employees');

  // Employees state
  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [companies, setCompanies]       = useState<Company[]>([]);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [loading, setLoading]           = useState(true);
  const [addOpen, setAddOpen]               = useState(false);
  const [viewTarget, setViewTarget]         = useState<Employee | null>(null);
  const [editTarget, setEditTarget]         = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<Employee | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<Employee | null>(null);

  // HR Managers state
  const [hrManagers, setHRManagers]   = useState<User[]>([]);
  const [hrLoading, setHRLoading]     = useState(false);
  const [addHROpen, setAddHROpen]     = useState(false);

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
    } catch {
      // axios interceptor shows error toast
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHRManagers = useCallback(async () => {
    if (!isAdmin) return;
    setHRLoading(true);
    try {
      const res = await api.get<User[]>('/accounts/users/?role=hr_manager');
      setHRManagers(res.data);
    } catch {
      // axios interceptor shows error toast
    } finally {
      setHRLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'hr_managers') fetchHRManagers();
  }, [activeTab, fetchHRManagers]);

  const handleSuccess = () => {
    setAddOpen(false);
    setEditTarget(null);
    setDeleteTarget(null);
    fetchData();
  };

  const handleHRSuccess = () => {
    setAddHROpen(false);
    fetchHRManagers();
  };

  const handleTransitioned = (updated: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const active   = employees.filter((e) => e.status === 'active').length;
  const inactive = employees.filter((e) => e.status === 'inactive').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {([
            { id: 'employees'   as TabId, label: 'Employees',   icon: Users },
            ...(isAdmin ? [{ id: 'hr_managers' as TabId, label: 'HR Managers', icon: ShieldCheck }] : []),
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                activeTab === id
                  ? 'bg-white text-[#2D3B55] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Action button */}
        {activeTab === 'employees' ? (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 h-10 px-5 rounded-xl
              bg-[#2D3B55] hover:bg-[#22C55E] text-white text-sm font-semibold
              transition-all duration-200 shadow-sm hover:shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        ) : isAdmin ? (
          <button
            onClick={() => setAddHROpen(true)}
            className="flex items-center gap-2 h-10 px-5 rounded-xl
              bg-[#2D3B55] hover:bg-[#22C55E] text-white text-sm font-semibold
              transition-all duration-200 shadow-sm hover:shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
          >
            <Plus className="w-4 h-4" /> Add HR Manager
          </button>
        ) : null}
      </div>

      {/* ── Employees tab ─────────────────────────────────────────────── */}
      {activeTab === 'employees' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Users,     label: 'Total Employees',
                value: loading ? null : employees.length,
                iconBg: 'bg-[#2D3B55]/10', iconColor: 'text-[#2D3B55]',
              },
              {
                icon: UserCheck, label: 'Active',
                value: loading ? null : active,
                iconBg: 'bg-[#22C55E]/10', iconColor: 'text-[#22C55E]',
              },
              {
                icon: Briefcase, label: 'Inactive',
                value: loading ? null : inactive,
                iconBg: 'bg-gray-200/60', iconColor: 'text-gray-400',
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

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {[
                      ['Employee', 'text-left'],
                      ['Email', 'text-left'],
                      ['Mobile', 'text-left'],
                      ['Title', 'text-left'],
                      ['Department', 'text-left'],
                      ['Status', 'text-left'],
                      ['Onboarding', 'text-left'],
                      ['Tenure', 'text-left'],
                      ['Actions', 'text-right'],
                    ].map(([h, align]) => (
                      <th key={h}
                        className={`px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${align}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => <SkeletonRow key={i} cols={9} />)
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">No employees yet</p>
                        <p className="text-xs text-gray-300 mt-1">Click "Add Employee" to get started</p>
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => {
                      const color = avatarColor(emp.name);
                      const deptName = deptMap.get(emp.department_id) ?? '—';
                      return (
                        <tr key={emp.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">

                          {/* Employee */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-white text-xs font-bold">{getInitials(emp.name)}</span>
                              </div>
                              <span className="font-medium text-gray-900 whitespace-nowrap">{emp.name}</span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3.5 text-gray-500 max-w-[180px] truncate">
                            {emp.email}
                          </td>

                          {/* Mobile */}
                          <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{emp.mobile}</td>

                          {/* Title */}
                          <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{emp.title}</td>

                          {/* Department */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <LayoutGrid className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-600 whitespace-nowrap">{deptName}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span className={[
                              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
                              emp.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500',
                            ].join(' ')}>
                              {emp.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Onboarding */}
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => setTransitionTarget(emp)}
                              className={[
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full',
                                'text-xs font-semibold transition-opacity hover:opacity-75',
                                ONBOARDING_BADGE[emp.onboarding_status].cls,
                              ].join(' ')}
                            >
                              {ONBOARDING_BADGE[emp.onboarding_status].label}
                              <ChevronRight className="w-3 h-3 opacity-50" />
                            </button>
                          </td>

                          {/* Tenure */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              {formatDaysEmployed(emp.days_employed)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setViewTarget(emp)} title="View"
                                className="p-1.5 rounded-lg text-gray-400
                                  hover:bg-sky-50 hover:text-sky-600 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditTarget(emp)} title="Edit"
                                className="p-1.5 rounded-lg text-gray-400
                                  hover:bg-[#2D3B55]/10 hover:text-[#2D3B55] transition-colors">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteTarget(emp)} title="Delete"
                                className="p-1.5 rounded-lg text-gray-400
                                  hover:bg-red-50 hover:text-red-500 transition-colors">
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
          </div>
        </>
      )}

      {/* ── HR Managers tab ───────────────────────────────────────────── */}
      {activeTab === 'hr_managers' && isAdmin && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4
              flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#2D3B55] leading-none">
                  {hrLoading
                    ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
                    : hrManagers.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total HR Managers</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {[
                      ['Email', 'text-left'],
                      ['Company', 'text-left'],
                      ['Role', 'text-left'],
                    ].map(([h, align]) => (
                      <th key={h}
                        className={`px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${align}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hrLoading ? (
                    [...Array(4)].map((_, i) => <SkeletonRow key={i} cols={3} />)
                  ) : hrManagers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-16 text-center">
                        <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">No HR managers yet</p>
                        <p className="text-xs text-gray-300 mt-1">Click "Add HR Manager" to get started</p>
                      </td>
                    </tr>
                  ) : (
                    hrManagers.map((mgr) => (
                      <tr key={mgr.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">

                        {/* Email */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white text-xs font-bold">
                                {mgr.email[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="text-gray-700">{mgr.email}</span>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600">
                              {mgr.company_id ? companyMap.get(mgr.company_id) ?? '—' : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                            bg-sky-100 text-sky-700">
                            HR Manager
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {viewTarget && (
        <ViewModal
          employee={viewTarget}
          deptMap={deptMap}
          companyMap={companyMap}
          onClose={() => setViewTarget(null)}
        />
      )}
      {addOpen && (
        <EmployeeModal
          companies={companies}
          departments={departments}
          isAdmin={isAdmin}
          defaultCompanyId={user?.company_id ?? undefined}
          onClose={() => setAddOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
      {editTarget && (
        <EmployeeModal
          employee={editTarget}
          companies={companies}
          departments={departments}
          isAdmin={isAdmin}
          defaultCompanyId={user?.company_id ?? undefined}
          onClose={() => setEditTarget(null)}
          onSuccess={handleSuccess}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          employee={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleSuccess}
        />
      )}
      {addHROpen && (
        <HRManagerModal
          companies={companies}
          onClose={() => setAddHROpen(false)}
          onSuccess={handleHRSuccess}
        />
      )}
      {transitionTarget && (
        <TransitionModal
          employee={transitionTarget}
          onClose={() => setTransitionTarget(null)}
          onTransitioned={handleTransitioned}
        />
      )}

    </div>
  );
}
