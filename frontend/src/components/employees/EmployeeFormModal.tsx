import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserCheck } from 'lucide-react';
import api from '../../api/axios';
import type { Company, Department, Employee } from '../../types';
import { Modal, ModalHeader, ModalFooter } from '../ui/Modal';

interface BaseForm {
  name: string; email: string; mobile: string; address: string;
  title: string; hire_date: string; status: 'active' | 'inactive';
  company: number; department: number;
}
interface AddForm extends BaseForm { initial_password: string; confirm_password: string }

interface Props {
  employee?: Employee;
  companies: Company[];
  departments: Department[];
  isAdmin: boolean;
  defaultCompanyId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const fld = (hasError: boolean) => [
  'w-full h-10 px-3 rounded-xl border text-sm text-gray-900',
  'placeholder:text-gray-400 transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]',
  hasError ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300',
].join(' ');

const Err = ({ msg }: { msg?: string }) =>
  msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

export function EmployeeFormModal({
  employee, companies, departments, isAdmin, defaultCompanyId, onClose, onSuccess,
}: Props) {
  const isEdit         = !!employee;
  const defaultCompany = employee?.company_id ?? defaultCompanyId ?? companies[0]?.id ?? 0;

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<AddForm>({
      defaultValues: {
        name: employee?.name ?? '', email: employee?.email ?? '',
        mobile: employee?.mobile ?? '', address: employee?.address ?? '',
        title: employee?.title ?? '', hire_date: employee?.hire_date ?? '',
        status: employee?.status ?? 'active',
        company: defaultCompany, department: employee?.department_id ?? 0,
        initial_password: '', confirm_password: '',
      },
    });

  const watchedCompany  = Number(watch('company'));
  const watchedPassword = watch('initial_password');

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setValue('department', 0);
  }, [watchedCompany, setValue]);

  const filteredDepts = departments.filter((d) => d.company_id === watchedCompany);

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

  return (
    <Modal maxWidth="lg" className="flex flex-col max-h-[92vh]">
      <ModalHeader
        title={isEdit ? 'Edit Employee' : 'Add Employee'}
        icon={<UserCheck className="w-4 h-4 text-[#2D3B55]" />}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Jane Smith" className={fld(!!errors.name)}
                {...register('name', { required: 'Required' })} />
              <Err msg={errors.name?.message} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" placeholder="jane@company.com" className={fld(!!errors.email)}
                {...register('email', {
                  required: 'Required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })} />
              <Err msg={errors.email?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mobile <span className="text-red-500">*</span></label>
              <input type="tel" placeholder="+1 555 000 0000" className={fld(!!errors.mobile)}
                {...register('mobile', {
                  required: 'Required',
                  validate: (v) => v.replace(/\D/g, '').length === 11 || 'Mobile must contain 11 digits',
                })} />
              <Err msg={errors.mobile?.message} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input type="text" placeholder="123 Main St" className={fld(false)} {...register('address')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Job Title <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Software Engineer" className={fld(!!errors.title)}
                {...register('title', { required: 'Required' })} />
              <Err msg={errors.title?.message} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hire Date <span className="text-red-500">*</span></label>
              <input type="date" className={fld(!!errors.hire_date)}
                {...register('hire_date', {
                  required: 'Required',
                  validate: (v) => {
                    if (!v) return 'Required';
                    const selected = new Date(v);
                    const today = new Date();
                    // zero time portion for accurate date-only comparison
                    selected.setHours(0,0,0,0);
                    today.setHours(0,0,0,0);
                    return selected <= today || 'Hire date cannot be in the future';
                  },
                })} />
              <Err msg={errors.hire_date?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select className={fld(false)} {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company <span className="text-red-500">*</span></label>
              <select
                disabled={!isAdmin}
                className={[fld(!!errors.company), !isAdmin && 'opacity-70 cursor-not-allowed'].filter(Boolean).join(' ')}
                {...register('company', {
                  required: 'Required', valueAsNumber: true,
                  validate: (v) => v > 0 || 'Select a company',
                })}
              >
                <option value={0}>Select company…</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Err msg={errors.company?.message} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department <span className="text-red-500">*</span></label>
            <select
              disabled={!watchedCompany}
              className={[fld(!!errors.department), !watchedCompany && 'opacity-70 cursor-not-allowed'].filter(Boolean).join(' ')}
              {...register('department', {
                required: 'Required', valueAsNumber: true,
                validate: (v) => v > 0 || 'Select a department',
              })}
            >
              <option value={0}>{watchedCompany ? 'Select department…' : 'Select a company first…'}</option>
              {filteredDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <Err msg={errors.department?.message} />
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Initial Password <span className="text-red-500">*</span></label>
                <input type="password" placeholder="Min. 8 characters" className={fld(!!errors.initial_password)}
                  {...register('initial_password', {
                    required: 'Required',
                    minLength: { value: 8, message: 'Min 8 characters' },
                  })} />
                <Err msg={errors.initial_password?.message} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                <input type="password" placeholder="Repeat password" className={fld(!!errors.confirm_password)}
                  {...register('confirm_password', {
                    required: 'Required',
                    validate: (v) => v === watchedPassword || 'Passwords do not match',
                  })} />
                <Err msg={errors.confirm_password?.message} />
              </div>
            </div>
          )}

        </div>
        <ModalFooter
          onCancel={onClose}
          submitLabel={isEdit ? 'Save Changes' : 'Add Employee'}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  );
}
