from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from companies.models import Company
from departments.models import Department
from employees.models import Employee


class EmployeeModelTests(TestCase):
    def test_days_employed_is_calculated_from_hire_date(self):
        company = Company.objects.create(name="Nile Tech")
        department = Department.objects.create(name="Engineering", company=company)
        user = User.objects.create_user(
            email="employee@niletech.io",
            password="pass",
            role=User.Role.EMPLOYEE,
            company=company,
        )
        hire_date = timezone.now().date() - timedelta(days=10)

        employee = Employee.objects.create(
            user=user,
            company=company,
            department=department,
            name="Ahmed Hassan",
            email=user.email,
            mobile="01012345678",
            title="Software Engineer",
            hire_date=hire_date,
            status=Employee.Status.ACTIVE,
            onboarding_status=Employee.OnboardingStatus.HIRED,
        )

        self.assertEqual(employee.days_employed, 10)
