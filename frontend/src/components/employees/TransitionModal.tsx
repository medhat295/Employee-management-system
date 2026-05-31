import { useState } from 'react';
import { Loader2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import type { Employee, OnboardingStatus } from '../../types';
import { getInitials, avatarColor } from '../../utils/format';
import { Modal, ModalHeader } from '../ui/Modal';
import { ONBOARDING_BADGE, NEXT_TRANSITIONS } from './onboardingConfig';

interface Props {
  employee: Employee;
  onClose: () => void;
  onTransitioned: (updated: Employee) => void;
}

export function TransitionModal({ employee, onClose, onTransitioned }: Props) {
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
    <Modal maxWidth="sm">
      <ModalHeader title="Move to Next Stage" onClose={onClose} />
      <div className="px-6 py-5 space-y-5">

        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-sm font-bold">{getInitials(employee.name)}</span>
          </div>
          <div>
            <p className="font-semibold text-[#2D3B55]">{employee.name}</p>
            <p className="text-xs text-gray-500">{employee.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Current stage</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
        </div>

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
                    transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
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
    </Modal>
  );
}
