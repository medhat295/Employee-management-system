from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from companies.models import Company
from departments.models import Department
from employees.models import Employee


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_company(name="Nile Tech"):
    return Company.objects.create(name=name)


def make_dept(name="Engineering", company=None):
    company = company or make_company()
    return Department.objects.create(name=name, company=company)


def make_user(email, role, company=None, is_active=True):
    user = User.objects.create_user(
        email=email, password="pass", role=role, company=company,
    )
    user.is_active = is_active
    user.save()
    return user


def make_employee(user, company, dept, name="Ahmed Hassan", email=None,
                  onboarding=Employee.OnboardingStatus.HIRED,
                  emp_status=Employee.Status.ACTIVE):
    return Employee.objects.create(
        user=user,
        company=company,
        department=dept,
        name=name,
        email=email or user.email,
        mobile="01012345678",
        title="Software Engineer",
        hire_date=date(2022, 1, 15),
        status=emp_status,
        onboarding_status=onboarding,
    )


# ---------------------------------------------------------------------------
# Base test case with shared setup
# ---------------------------------------------------------------------------

class EmployeeAPITestCase(APITestCase):
    def setUp(self):
        self.company_a = make_company("Nile Tech")
        self.company_b = make_company("Al-Madar Healthcare")
        self.dept_a = make_dept("Engineering", self.company_a)
        self.dept_b = make_dept("Medical", self.company_b)

        self.admin = make_user("admin@sys.com", User.Role.ADMIN)
        self.hr_a = make_user("hr@niletech.io", User.Role.HR_MANAGER, company=self.company_a)
        self.hr_b = make_user("hr@almadar.com", User.Role.HR_MANAGER, company=self.company_b)

        self.emp_user_a = make_user("ahmed@niletech.io", User.Role.EMPLOYEE, company=self.company_a)
        self.emp_user_b = make_user("sara@almadar.com", User.Role.EMPLOYEE, company=self.company_b)

        self.emp_a = make_employee(self.emp_user_a, self.company_a, self.dept_a, name="Ahmed Hassan")
        self.emp_b = make_employee(self.emp_user_b, self.company_b, self.dept_b, name="Sara Mohamed")


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

class AuthenticationTests(EmployeeAPITestCase):
    def test_unauthenticated_list_returns_401(self):
        url = reverse("employee-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_detail_returns_401(self):
        url = reverse("employee-detail", args=[self.emp_a.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# List endpoint
# ---------------------------------------------------------------------------

class EmployeeListTests(EmployeeAPITestCase):
    def test_admin_sees_all_employees(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse("employee-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [e["id"] for e in response.data]
        self.assertIn(self.emp_a.pk, ids)
        self.assertIn(self.emp_b.pk, ids)

    def test_hr_manager_sees_only_own_company(self):
        self.client.force_authenticate(self.hr_a)
        response = self.client.get(reverse("employee-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [e["id"] for e in response.data]
        self.assertIn(self.emp_a.pk, ids)
        self.assertNotIn(self.emp_b.pk, ids)

    def test_employee_cannot_list(self):
        self.client.force_authenticate(self.emp_user_a)
        response = self.client.get(reverse("employee-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Retrieve endpoint
# ---------------------------------------------------------------------------

class EmployeeRetrieveTests(EmployeeAPITestCase):
    def test_admin_can_retrieve_any_employee(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse("employee-detail", args=[self.emp_b.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.emp_b.pk)

    def test_employee_can_retrieve_own_profile(self):
        self.client.force_authenticate(self.emp_user_a)
        response = self.client.get(reverse("employee-detail", args=[self.emp_a.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_cannot_retrieve_other_profile(self):
        self.client.force_authenticate(self.emp_user_a)
        response = self.client.get(reverse("employee-detail", args=[self.emp_b.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_hr_manager_cannot_retrieve_other_company_employee(self):
        self.client.force_authenticate(self.hr_a)
        response = self.client.get(reverse("employee-detail", args=[self.emp_b.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Create endpoint
# ---------------------------------------------------------------------------

class EmployeeCreateTests(EmployeeAPITestCase):
    def _create_payload(self, company_id, dept_id, email="nour@niletech.io"):
        return {
            "name": "Nour Hassan",
            "email": email,
            "mobile": "01198765432",
            "title": "QA Engineer",
            "hire_date": "2023-06-01",
            "status": "active",
            "company": company_id,
            "department": dept_id,
            "initial_password": "Secure@123",
        }

    def test_hr_manager_creates_employee_in_own_company(self):
        self.client.force_authenticate(self.hr_a)
        payload = self._create_payload(self.company_a.pk, self.dept_a.pk)
        response = self.client.post(reverse("employee-list"), payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Nour Hassan")

    def test_hr_manager_cannot_create_employee_in_other_company(self):
        self.client.force_authenticate(self.hr_a)
        payload = self._create_payload(self.company_b.pk, self.dept_b.pk, "heba@almadar.com")
        response = self.client.post(reverse("employee-list"), payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_with_department_from_wrong_company_returns_400(self):
        self.client.force_authenticate(self.admin)
        payload = self._create_payload(self.company_a.pk, self.dept_b.pk, "rania@niletech.io")
        response = self.client.post(reverse("employee-list"), payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("department", response.data)

    def test_create_with_duplicate_email_returns_400(self):
        self.client.force_authenticate(self.admin)
        payload = self._create_payload(self.company_a.pk, self.dept_a.pk, "ahmed@niletech.io")
        response = self.client.post(reverse("employee-list"), payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_employee_cannot_create(self):
        self.client.force_authenticate(self.emp_user_a)
        payload = self._create_payload(self.company_a.pk, self.dept_a.pk, "yasmine@niletech.io")
        response = self.client.post(reverse("employee-list"), payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Partial update endpoint
# ---------------------------------------------------------------------------

class EmployeePartialUpdateTests(EmployeeAPITestCase):
    def test_hr_manager_can_update_title(self):
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-detail", args=[self.emp_a.pk])
        response = self.client.patch(url, {"title": "Senior Software Engineer"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Senior Software Engineer")

    def test_updating_email_syncs_linked_user_email(self):
        self.client.force_authenticate(self.admin)
        url = reverse("employee-detail", args=[self.emp_a.pk])
        response = self.client.patch(url, {"email": "ahmed.updated@niletech.io"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.emp_a.refresh_from_db()
        self.emp_user_a.refresh_from_db()
        self.assertEqual(self.emp_a.email, "ahmed.updated@niletech.io")
        self.assertEqual(self.emp_user_a.email, "ahmed.updated@niletech.io")

    def test_updating_company_syncs_linked_user_company(self):
        dept_ops = make_dept("Operations", self.company_b)
        self.client.force_authenticate(self.admin)
        url = reverse("employee-detail", args=[self.emp_a.pk])
        response = self.client.patch(url, {"company": self.company_b.pk, "department": dept_ops.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.emp_a.refresh_from_db()
        self.emp_user_a.refresh_from_db()
        self.assertEqual(self.emp_a.company_id, self.company_b.pk)
        self.assertEqual(self.emp_user_a.company_id, self.company_b.pk)

    def test_setting_status_inactive_deactivates_user(self):
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-detail", args=[self.emp_a.pk])
        response = self.client.patch(url, {"status": "inactive"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.emp_user_a.refresh_from_db()
        self.assertFalse(self.emp_user_a.is_active)

    def test_setting_status_active_activates_user(self):
        self.emp_user_a.is_active = False
        self.emp_user_a.save()
        self.emp_a.status = Employee.Status.INACTIVE
        self.emp_a.onboarding_status = Employee.OnboardingStatus.INTERVIEW_SCHEDULED
        self.emp_a.save()
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-detail", args=[self.emp_a.pk])
        response = self.client.patch(url, {"status": "active"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.emp_a.refresh_from_db()
        self.emp_user_a.refresh_from_db()
        self.assertTrue(self.emp_user_a.is_active)
        self.assertEqual(self.emp_a.onboarding_status, Employee.OnboardingStatus.HIRED)

    def test_hr_cannot_update_employee_in_other_company(self):
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-detail", args=[self.emp_b.pk])
        response = self.client.patch(url, {"title": "Hacker"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# Destroy endpoint
# ---------------------------------------------------------------------------

class EmployeeDestroyTests(EmployeeAPITestCase):
    def test_admin_can_delete_employee(self):
        self.client.force_authenticate(self.admin)
        url = reverse("employee-detail", args=[self.emp_a.pk])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Employee.objects.filter(pk=self.emp_a.pk).exists())

    def test_deleting_employee_also_deletes_linked_user(self):
        self.client.force_authenticate(self.admin)
        url = reverse("employee-detail", args=[self.emp_a.pk])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.emp_user_a.pk).exists())

    def test_hr_cannot_delete_employee_in_other_company(self):
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-detail", args=[self.emp_b.pk])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# /me endpoint
# ---------------------------------------------------------------------------

class MeEndpointTests(EmployeeAPITestCase):
    def test_employee_gets_own_profile(self):
        self.client.force_authenticate(self.emp_user_a)
        response = self.client.get(reverse("employee-me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.emp_a.pk)
        self.assertEqual(response.data["name"], "Ahmed Hassan")

    def test_days_employed_present_in_me_response(self):
        self.client.force_authenticate(self.emp_user_a)
        response = self.client.get(reverse("employee-me"))
        self.assertIn("days_employed", response.data)
        self.assertGreaterEqual(response.data["days_employed"], 0)

    def test_hr_manager_without_employee_profile_returns_404(self):
        self.client.force_authenticate(self.hr_a)
        response = self.client.get(reverse("employee-me"))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# /transition endpoint
# ---------------------------------------------------------------------------

class TransitionEndpointTests(EmployeeAPITestCase):
    def _make_pending_employee(self, name, email):
        user = make_user(email, User.Role.EMPLOYEE, company=self.company_a, is_active=False)
        return make_employee(
            user, self.company_a, self.dept_a,
            name=name, email=email,
            onboarding=Employee.OnboardingStatus.APPLICATION_RECEIVED,
            emp_status=Employee.Status.INACTIVE,
        )

    def test_valid_transition_advances_status(self):
        emp = self._make_pending_employee("Mariam Youssef", "mariam@niletech.io")
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-transition", args=[emp.pk])
        response = self.client.post(url, {"onboarding_status": "interview_scheduled"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emp.refresh_from_db()
        self.assertEqual(emp.onboarding_status, Employee.OnboardingStatus.INTERVIEW_SCHEDULED)

    def test_transition_to_hired_activates_user(self):
        emp = self._make_pending_employee("Kareem Mostafa", "kareem@niletech.io")
        emp.onboarding_status = Employee.OnboardingStatus.INTERVIEW_SCHEDULED
        emp.save()
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-transition", args=[emp.pk])
        response = self.client.post(url, {"onboarding_status": "hired"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emp.refresh_from_db()
        emp.user.refresh_from_db()
        self.assertEqual(emp.status, Employee.Status.ACTIVE)
        self.assertTrue(emp.user.is_active)

    def test_transition_to_not_accepted_deactivates_user(self):
        emp = self._make_pending_employee("Hana Kamal", "hana@niletech.io")
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-transition", args=[emp.pk])
        response = self.client.post(url, {"onboarding_status": "not_accepted"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emp.refresh_from_db()
        emp.user.refresh_from_db()
        self.assertEqual(emp.status, Employee.Status.INACTIVE)
        self.assertFalse(emp.user.is_active)

    def test_invalid_transition_returns_400(self):
        emp = self._make_pending_employee("Dina Ibrahim", "dina@niletech.io")
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-transition", args=[emp.pk])
        response = self.client.post(url, {"onboarding_status": "hired"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_hr_cannot_transition_employee_in_other_company(self):
        self.client.force_authenticate(self.hr_a)
        url = reverse("employee-transition", args=[self.emp_b.pk])
        response = self.client.post(url, {"onboarding_status": "not_accepted"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
