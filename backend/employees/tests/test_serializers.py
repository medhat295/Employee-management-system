from datetime import date

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from accounts.models import User
from companies.models import Company
from departments.models import Department
from employees.models import Employee
from employees.serializers import EmployeeSerializer, TransitionSerializer


def make_company(name="Nile Tech"):
    return Company.objects.create(name=name)


def make_dept(name="Engineering", company=None):
    company = company or make_company()
    return Department.objects.create(name=name, company=company)


def make_user(email="test@niletech.io", company=None):
    return User.objects.create_user(
        email=email, password="pass", role=User.Role.EMPLOYEE, company=company,
    )


def make_employee(user, company, dept, email=None):
    return Employee.objects.create(
        user=user,
        company=company,
        department=dept,
        name="Ahmed Hassan",
        email=email or user.email,
        mobile="01012345678",
        title="Software Engineer",
        hire_date=date.today(),
        status=Employee.Status.ACTIVE,
        onboarding_status=Employee.OnboardingStatus.HIRED,
    )


# ---------------------------------------------------------------------------
# Email validation
# ---------------------------------------------------------------------------

class EmailValidationTests(TestCase):
    def setUp(self):
        self.company = make_company()
        self.dept = make_dept(company=self.company)

    def test_duplicate_email_raises_error_on_create(self):
        existing_user = make_user("sara@niletech.io", company=self.company)
        make_employee(existing_user, self.company, self.dept)

        serializer = EmployeeSerializer()
        with self.assertRaises(ValidationError) as ctx:
            serializer.validate_email("sara@niletech.io")
        self.assertIn("already exists", str(ctx.exception.detail[0]))

    def test_unique_email_passes_on_create(self):
        serializer = EmployeeSerializer()
        result = serializer.validate_email("new.employee@niletech.io")
        self.assertEqual(result, "new.employee@niletech.io")

    def test_own_email_allowed_on_update(self):
        user = make_user("kareem@niletech.io", company=self.company)
        emp = make_employee(user, self.company, self.dept)

        serializer = EmployeeSerializer(instance=emp)
        result = serializer.validate_email("kareem@niletech.io")
        self.assertEqual(result, "kareem@niletech.io")


# ---------------------------------------------------------------------------
# Department / company cross-validation
# ---------------------------------------------------------------------------

class DepartmentCompanyValidationTests(TestCase):
    def setUp(self):
        self.company_a = make_company("Company A")
        self.company_b = make_company("Company B")
        self.dept_a = make_dept("Engineering", company=self.company_a)
        self.dept_b = make_dept("Engineering", company=self.company_b)

    def test_department_in_correct_company_passes(self):
        serializer = EmployeeSerializer()
        result = serializer.validate({"company": self.company_a, "department": self.dept_a})
        self.assertIn("company", result)

    def test_department_from_wrong_company_raises_error(self):
        serializer = EmployeeSerializer()
        with self.assertRaises(ValidationError) as ctx:
            serializer.validate({"company": self.company_a, "department": self.dept_b})
        self.assertIn("department", ctx.exception.detail)

    def test_missing_company_in_attrs_uses_instance_company(self):
        user = make_user("test@company-a.com", company=self.company_a)
        emp = make_employee(user, self.company_a, self.dept_a)

        serializer = EmployeeSerializer(instance=emp)
        # Only passing department (no company in attrs) — should fall back to instance.company
        result = serializer.validate({"department": self.dept_a})
        self.assertIn("department", result)


# ---------------------------------------------------------------------------
# TransitionSerializer — valid transitions
# ---------------------------------------------------------------------------

class TransitionSerializerValidTests(TestCase):
    def _assert_valid(self, from_status, to_status):
        s = TransitionSerializer(
            data={"onboarding_status": to_status},
            context={"current_status": from_status},
        )
        self.assertTrue(s.is_valid(), msg=s.errors)
        self.assertEqual(s.validated_data["onboarding_status"], to_status)

    def test_application_received_to_interview_scheduled(self):
        self._assert_valid(
            Employee.OnboardingStatus.APPLICATION_RECEIVED,
            Employee.OnboardingStatus.INTERVIEW_SCHEDULED,
        )

    def test_application_received_to_not_accepted(self):
        self._assert_valid(
            Employee.OnboardingStatus.APPLICATION_RECEIVED,
            Employee.OnboardingStatus.NOT_ACCEPTED,
        )

    def test_interview_scheduled_to_hired(self):
        self._assert_valid(
            Employee.OnboardingStatus.INTERVIEW_SCHEDULED,
            Employee.OnboardingStatus.HIRED,
        )

    def test_interview_scheduled_to_not_accepted(self):
        self._assert_valid(
            Employee.OnboardingStatus.INTERVIEW_SCHEDULED,
            Employee.OnboardingStatus.NOT_ACCEPTED,
        )

    def test_hired_to_not_accepted(self):
        self._assert_valid(
            Employee.OnboardingStatus.HIRED,
            Employee.OnboardingStatus.NOT_ACCEPTED,
        )

    def test_not_accepted_to_application_received(self):
        self._assert_valid(
            Employee.OnboardingStatus.NOT_ACCEPTED,
            Employee.OnboardingStatus.APPLICATION_RECEIVED,
        )


# ---------------------------------------------------------------------------
# TransitionSerializer — invalid transitions
# ---------------------------------------------------------------------------

class TransitionSerializerInvalidTests(TestCase):
    def _assert_invalid(self, from_status, to_status):
        s = TransitionSerializer(
            data={"onboarding_status": to_status},
            context={"current_status": from_status},
        )
        self.assertFalse(s.is_valid())
        self.assertIn("onboarding_status", s.errors)

    def test_cannot_skip_from_application_to_hired(self):
        self._assert_invalid(
            Employee.OnboardingStatus.APPLICATION_RECEIVED,
            Employee.OnboardingStatus.HIRED,
        )

    def test_cannot_go_back_from_hired_to_interview(self):
        self._assert_invalid(
            Employee.OnboardingStatus.HIRED,
            Employee.OnboardingStatus.INTERVIEW_SCHEDULED,
        )

    def test_cannot_go_back_from_interview_to_application(self):
        self._assert_invalid(
            Employee.OnboardingStatus.INTERVIEW_SCHEDULED,
            Employee.OnboardingStatus.APPLICATION_RECEIVED,
        )

    def test_cannot_stay_on_same_status(self):
        self._assert_invalid(
            Employee.OnboardingStatus.HIRED,
            Employee.OnboardingStatus.HIRED,
        )

    def test_error_message_lists_allowed_transitions(self):
        s = TransitionSerializer(
            data={"onboarding_status": Employee.OnboardingStatus.HIRED},
            context={"current_status": Employee.OnboardingStatus.APPLICATION_RECEIVED},
        )
        self.assertFalse(s.is_valid())
        error_text = str(s.errors["onboarding_status"])
        self.assertIn("application_received", error_text)
