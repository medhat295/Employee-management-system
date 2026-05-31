from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from companies.models import Company
from departments.models import Department
from employees.models import Employee


def make_company(name="Nile Tech"):
    return Company.objects.create(name=name)


def make_dept(name="Engineering", company=None):
    company = company or make_company()
    return Department.objects.create(name=name, company=company)


def make_user(email, role, company=None):
    return User.objects.create_user(
        email=email,
        password="pass",
        role=role,
        company=company,
    )


def make_employee(user, company, dept):
    return Employee.objects.create(
        user=user,
        company=company,
        department=dept,
        name="Ahmed Hassan",
        email=user.email,
        mobile="01012345678",
        title="Software Engineer",
        hire_date="2024-01-15",
        status=Employee.Status.ACTIVE,
        onboarding_status=Employee.OnboardingStatus.HIRED,
    )


class DepartmentEmployeeAccessTests(APITestCase):
    def setUp(self):
        self.company_a = make_company("Nile Tech")
        self.company_b = make_company("Al-Madar Healthcare")
        self.dept_a1 = make_dept("Engineering", self.company_a)
        self.dept_a2 = make_dept("HR", self.company_a)
        self.dept_b1 = make_dept("Medical", self.company_b)

        self.employee_user = make_user(
            "employee@niletech.io",
            User.Role.EMPLOYEE,
            company=self.company_a,
        )
        make_employee(self.employee_user, self.company_a, self.dept_a1)

    def test_employee_can_retrieve_own_department(self):
        self.client.force_authenticate(self.employee_user)
        response = self.client.get(reverse("department-detail", args=[self.dept_a1.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.dept_a1.pk)

    def test_employee_cannot_retrieve_other_department_in_same_company(self):
        self.client.force_authenticate(self.employee_user)
        response = self.client.get(reverse("department-detail", args=[self.dept_a2.pk]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_employee_cannot_retrieve_department_from_other_company(self):
        self.client.force_authenticate(self.employee_user)
        response = self.client.get(reverse("department-detail", args=[self.dept_b1.pk]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

