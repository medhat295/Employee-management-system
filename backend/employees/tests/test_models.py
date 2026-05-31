from datetime import date, timedelta

from django.test import TestCase

from accounts.models import User
from companies.models import Company
from departments.models import Department
from employees.models import Employee


def make_employee(hire_date, name="Ahmed Hassan", title="Engineer"):
    company = Company.objects.create(name=f"Company for {name}")
    dept = Department.objects.create(name="Engineering", company=company)
    user = User.objects.create_user(
        email=f"{name.replace(' ', '.').lower()}@test.com",
        password="pass",
        role=User.Role.EMPLOYEE,
    )
    return Employee.objects.create(
        user=user,
        company=company,
        department=dept,
        name=name,
        email=user.email,
        mobile="01012345678",
        title=title,
        hire_date=hire_date,
        status=Employee.Status.ACTIVE,
        onboarding_status=Employee.OnboardingStatus.HIRED,
    )


class DaysEmployedTests(TestCase):
    def test_hired_today_returns_zero(self):
        emp = make_employee(hire_date=date.today())
        self.assertEqual(emp.days_employed, 0)

    def test_hired_yesterday_returns_one(self):
        emp = make_employee(hire_date=date.today() - timedelta(days=1), name="Sara Ahmed")
        self.assertEqual(emp.days_employed, 1)

    def test_hired_100_days_ago(self):
        emp = make_employee(hire_date=date.today() - timedelta(days=100), name="Mohamed Ali")
        self.assertEqual(emp.days_employed, 100)

    def test_hired_one_year_ago(self):
        emp = make_employee(hire_date=date.today() - timedelta(days=365), name="Fatima Omar")
        self.assertEqual(emp.days_employed, 365)

    def test_hired_five_years_ago(self):
        emp = make_employee(hire_date=date.today() - timedelta(days=1825), name="Omar Khaled")
        self.assertEqual(emp.days_employed, 1825)


class EmployeeStrTests(TestCase):
    def test_str_includes_name_and_title(self):
        emp = make_employee(hire_date=date.today(), name="Layla Ibrahim", title="Data Analyst")
        self.assertEqual(str(emp), "Layla Ibrahim (Data Analyst)")
