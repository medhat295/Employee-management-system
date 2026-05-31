import { Users } from 'lucide-react';

export function EmployeesPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-16
        flex flex-col items-center justify-center text-center">
        <Users className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Employees list coming soon</p>
        <p className="text-gray-400 text-sm mt-1">This page is under construction.</p>
      </div>
    </div>
  );
}
