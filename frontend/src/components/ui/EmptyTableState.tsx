import type { ElementType } from 'react';

interface EmptyTableStateProps {
  icon: ElementType;
  message: string;
  hint?: string;
  colSpan: number;
}

export function EmptyTableState({ icon: Icon, message, hint, colSpan }: EmptyTableStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        <Icon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400 font-medium">{message}</p>
        {hint && <p className="text-xs text-gray-300 mt-1">{hint}</p>}
      </td>
    </tr>
  );
}
