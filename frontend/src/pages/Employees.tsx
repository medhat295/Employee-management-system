import { Users } from 'lucide-react';

export function EmployeesPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Employees</h1>
            <p className="text-sm text-gray-500">Manage your company's workforce</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center justify-center text-center">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Employees list coming soon</p>
          <p className="text-gray-400 text-sm mt-1">This page is under construction.</p>
        </div>
      </div>
    </div>
  );
}
