import { Eye, Pencil, Trash2 } from 'lucide-react';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActionButtons({ onView, onEdit, onDelete }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {onView && (
        <button onClick={onView} title="View"
          className="p-1.5 rounded-lg text-gray-400 hover:bg-sky-50 hover:text-sky-600 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} title="Edit"
          className="p-1.5 rounded-lg text-gray-400 hover:bg-[#2D3B55]/10 hover:text-[#2D3B55] transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} title="Delete"
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
