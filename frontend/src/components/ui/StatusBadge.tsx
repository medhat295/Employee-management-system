interface StatusBadgeProps {
  status: 'active' | 'inactive';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={[
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
      status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500',
    ].join(' ')}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
}
