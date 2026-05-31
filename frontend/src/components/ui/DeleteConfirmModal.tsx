import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Modal } from './Modal';

interface DeleteConfirmModalProps {
  title: string;
  description: ReactNode;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  confirmLabel?: string;
  loadingLabel?: string;
}

export function DeleteConfirmModal({
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = 'Delete',
  loadingLabel = 'Deleting…',
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal maxWidth="sm">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium
              text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white
              text-sm font-semibold transition-colors flex items-center justify-center gap-2
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {loadingLabel}</> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
