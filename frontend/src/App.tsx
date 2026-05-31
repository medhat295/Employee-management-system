import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { CompaniesPage } from './pages/Companies';
import { DepartmentsPage } from './pages/Departments';
import { EmployeesPage } from './pages/Employees';
import { ProfilePage } from './pages/Profile';
import type { UserRole } from './types';
import type { ReactNode } from 'react';

function RootRedirect() {
  const { isAuthenticated, isEmployee } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isEmployee ? '/profile' : '/dashboard'} replace />;
}

function ProtectedLayout({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: UserRole[];
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/"      element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedLayout allowedRoles={['admin', 'hr_manager']}>
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/companies"
        element={
          <ProtectedLayout allowedRoles={['admin', 'hr_manager']}>
            <CompaniesPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedLayout allowedRoles={['admin', 'hr_manager']}>
            <DepartmentsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedLayout allowedRoles={['admin', 'hr_manager']}>
            <EmployeesPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedLayout allowedRoles={['admin', 'hr_manager', 'employee']}>
            <ProfilePage />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}

export default App;
