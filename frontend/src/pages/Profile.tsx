import { UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">My Profile</h1>
            <p className="text-sm text-gray-500">View and manage your profile</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent-dark capitalize">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Full profile page coming soon.</p>
        </div>
      </div>
    </div>
  );
}
