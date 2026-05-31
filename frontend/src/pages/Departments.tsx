import { LayoutGrid } from 'lucide-react';

export function DepartmentsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Departments</h1>
            <p className="text-sm text-gray-500">Manage departments within your company</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center justify-center text-center">
          <LayoutGrid className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Departments list coming soon</p>
          <p className="text-gray-400 text-sm mt-1">This page is under construction.</p>
        </div>
      </div>
    </div>
  );
}
