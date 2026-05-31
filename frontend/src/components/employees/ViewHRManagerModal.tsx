import { Building2, Mail, ShieldCheck } from 'lucide-react';
import type { User } from '../../types';
import { Modal, ModalHeader } from '../ui/Modal';

interface Props {
  manager: User;
  companyMap: Map<number, string>;
  onClose: () => void;
}

export function ViewHRManagerModal({ manager, companyMap, onClose }: Props) {
  return (
    <Modal maxWidth="md">
      <ModalHeader
        title="HR Manager Profile"
        icon={<ShieldCheck className="w-4 h-4 text-sky-600" />}
        iconBg="bg-sky-500/10"
        onClose={onClose}
      />
      <div className="px-6 py-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">{manager.email[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-[#2D3B55]">{manager.email}</p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">
              HR Manager
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm text-gray-800 font-medium truncate">{manager.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Company</p>
              <p className="text-sm text-gray-800 font-medium truncate">
                {manager.company_id ? companyMap.get(manager.company_id) ?? '—' : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-5">
        <button
          onClick={onClose}
          className="w-full h-10 rounded-xl bg-[#2D3B55] text-white text-sm font-semibold hover:bg-[#22C55E] transition-all duration-200"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
