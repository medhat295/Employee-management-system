interface TableSkeletonRowProps {
  cols: number;
  widths?: string[];
}

const DEFAULT_WIDTHS = ['w-2/5', 'w-1/5', 'w-1/6', 'w-1/5', 'w-1/6', 'w-1/6', 'w-1/6', 'w-1/6'];

export function TableSkeletonRow({ cols, widths }: TableSkeletonRowProps) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className={`h-4 bg-gray-100 rounded-lg animate-pulse ${(widths ?? DEFAULT_WIDTHS)[i] ?? 'w-1/5'}`} />
        </td>
      ))}
    </tr>
  );
}
