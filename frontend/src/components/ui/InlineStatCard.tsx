import type { ElementType } from 'react';

interface InlineStatCardProps {
  icon: ElementType;
  label: string;
  value: number | null;
  iconBg: string;
  iconColor: string;
}

export function InlineStatCard({ icon: Icon, label, value, iconBg, iconColor }: InlineStatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#2D3B55] leading-none">
          {value === null
            ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
            : value}
        </p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
