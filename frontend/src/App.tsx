import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { CompaniesPage } from './pages/Companies';
import { DepartmentsPage } from './pages/Departments';
import { EmployeesPage } from './pages/Employees';
import { ProfilePage } from './pages/Profile';

function RootRedirect() {
  const { isAuthenticated, isEmployee } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isEmployee ? '/profile' : '/companies'} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/companies"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CompaniesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr_manager']}>
            <DepartmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr_manager']}>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr_manager', 'employee']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
