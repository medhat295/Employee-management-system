import { useAuth } from '../context/AuthContext';

const ROLE_BADGE: Record<string, string> = {
  admin:      'bg-emerald-100 text-emerald-700',
  hr_manager: 'bg-sky-100     text-sky-700',
  employee:   'bg-violet-100  text-violet-700',
};

const ROLE_LABEL: Record<string, string> = {
  admin:      'Admin',
  hr_manager: 'HR Manager',
  employee:   'Employee',
};

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#2D3B55]/10 flex items-center justify-center">
            <span className="text-[#2D3B55] font-bold text-xl">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.email}</p>
            {user?.role && (
              <span className={[
                'inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                ROLE_BADGE[user.role],
              ].join(' ')}>
                {ROLE_LABEL[user.role]}
              </span>
            )}
          </div>
        </div>
        <p className="text-gray-400 text-sm">Full profile page coming soon.</p>
      </div>
    </div>
  );
}
