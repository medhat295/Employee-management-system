import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import type { Company, User } from '../../types';
import { Modal, ModalHeader, ModalFooter } from '../ui/Modal';

interface HRManagerForm {
  email: string;
  password: string;
  confirm_password: string;
  company: number;
}

interface Props {
  companies: Company[];
  manager?: User;
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

export function HRManagerFormModal({ companies, manager, onClose, onSuccess }: Props) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<HRManagerForm>({
      defaultValues: {
        email: manager?.email ?? '',
        password: '',
        confirm_password: '',
        company: manager?.company_id ?? 0,
      },
    });

  const watchedPassword = watch('password');
  const isEditMode = !!manager;

  const onSubmit = async (data: HRManagerForm) => {
    try {
      const payload: { email: string; company: number; password?: string } = {
        email: data.email,
        company: data.company,
      };

      if (data.password) payload.password = data.password;

      if (isEditMode) {
        await api.patch(`/accounts/users/${manager.id}/`, payload);
        toast.success('HR Manager updated successfully');
      } else {
        await api.post('/accounts/users/', payload);
        toast.success('HR Manager created successfully');
      }
      onSuccess();
    } catch {
      // axios interceptor shows error toast
    }
  };

  return (
    <Modal maxWidth="md">
      <ModalHeader
        title={isEditMode ? 'Edit HR Manager' : 'Add HR Manager'}
        icon={<ShieldCheck className="w-4 h-4 text-sky-600" />}
        iconBg="bg-sky-500/10"
        onClose={onClose}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-6 py-5 space-y-4">

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" placeholder="hr@company.com" className={fld(!!errors.email)}
              {...register('email', {
                required: 'Required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })} />
            <Err msg={errors.email?.message} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company <span className="text-red-500">*</span></label>
            <select className={fld(!!errors.company)}
              {...register('company', {
                required: 'Required', valueAsNumber: true,
                validate: (v) => v > 0 || 'Select a company',
              })}>
              <option value={0}>Select company…</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Err msg={errors.company?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Password {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <input type="password" placeholder="Min. 8 characters" className={fld(!!errors.password)}
                {...register('password', {
                  validate: (v) => {
                    if (!v && isEditMode) return true;
                    if (!v) return 'Required';
                    if (v.length < 8) return 'Min 8 characters';
                    return true;
                  },
                })} />
              <Err msg={errors.password?.message} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Confirm Password {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <input type="password" placeholder="Repeat password" className={fld(!!errors.confirm_password)}
                {...register('confirm_password', {
                  validate: (v) => {
                    if (!watchedPassword && isEditMode) return true;
                    if (!v) return 'Required';
                    if (v !== watchedPassword) return 'Passwords do not match';
                    return true;
                  },
                })} />
              <Err msg={errors.confirm_password?.message} />
            </div>
          </div>

        </div>
        <ModalFooter
          onCancel={onClose}
          submitLabel={isEditMode ? 'Save Changes' : 'Add HR Manager'}
          isSubmitting={isSubmitting}
          loadingLabel={isEditMode ? 'Saving…' : 'Creating…'}
        />
      </form>
    </Modal>
  );
}
