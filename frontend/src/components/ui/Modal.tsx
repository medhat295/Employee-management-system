import { Loader2, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Modal({ children, maxWidth = 'md', className = '' }: ModalProps) {
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${widths[maxWidth]} ${className}`}>
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  icon?: ReactNode;
  iconBg?: string;
  onClose: () => void;
}

export function ModalHeader({ title, icon, iconBg = 'bg-[#2D3B55]/10', onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
        )}
        <h2 className="text-base font-semibold text-[#2D3B55]">{title}</h2>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ModalFooterProps {
  onCancel: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  loadingLabel?: string;
}

export function ModalFooter({ onCancel, submitLabel, isSubmitting, loadingLabel = 'Saving…' }: ModalFooterProps) {
  return (
    <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
      <button
        type="button"
        onClick={onCancel}
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
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {loadingLabel}</>
          : submitLabel}
      </button>
    </div>
  );
}
