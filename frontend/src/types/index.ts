export type UserRole = 'admin' | 'hr_manager' | 'employee';
export type EmployeeStatus = 'active' | 'inactive';
export type OnboardingStatus =
  | 'application_received'
  | 'interview_scheduled'
  | 'hired'
  | 'not_accepted';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  company_id: number | null;
}

export interface Company {
  id: number;
  name: string;
  logo: string | null;
  total_departments: number;
  total_employees: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  company_id: number;
  active_employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  user_id: number;
  company_id: number;
  department_id: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
  title: string;
  hire_date: string;
  status: EmployeeStatus;
  onboarding_status: OnboardingStatus;
  days_employed: number;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}
