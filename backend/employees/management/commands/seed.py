import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from companies.models import Company
from departments.models import Department
from employees.models import Employee


COMPANIES = [
    {"name": "Nile Tech Solutions", "domain": "niletech.io"},
    {"name": "Al-Madar Healthcare",  "domain": "almadar-health.com"},
    {"name": "Mena Trading Group",   "domain": "menatrading.com"},
]

DEPARTMENTS = {
    "Nile Tech Solutions": [
        "Engineering", "Product", "Quality Assurance", "Human Resources", "Finance",
    ],
    "Al-Madar Healthcare": [
        "Medical", "Nursing", "Administration", "Human Resources", "Finance",
    ],
    "Mena Trading Group": [
        "Sales", "Operations", "Logistics", "Human Resources", "Finance",
    ],
}

MALE_NAMES = [
    "Ahmed Hassan", "Mohamed Ali", "Omar Khaled", "Youssef Ibrahim",
    "Kareem Mostafa", "Hassan Nasser", "Ali Sayed", "Ibrahim Mahmoud",
    "Tarek Farouk", "Amr Sherif", "Wael Adel", "Samir Gamal",
    "Khaled Mansour", "Bassem Lotfy", "Sherif Ragab", "Nader Hossam",
    "Mahmoud Zaki", "Essam Fawzy", "Tamer Salah", "Hany Abdel",
]

FEMALE_NAMES = [
    "Sara Ahmed", "Fatima Mohamed", "Layla Omar", "Nour Hassan",
    "Amira Khalid", "Mariam Youssef", "Rania Ali", "Dina Ibrahim",
    "Yasmine Mostafa", "Hana Kamal", "Noha Tamer", "Mona Essam",
    "Rana Magdy", "Shaimaa Nader", "Heba Fouad", "Nada Sameh",
    "Mai Walid", "Aya Ehab", "Doaa Ramadan", "Salma Osama",
]

TITLES_BY_DEPARTMENT = {
    "Engineering": [
        "Software Engineer", "Senior Software Engineer", "Frontend Developer",
        "Backend Developer", "DevOps Engineer", "Full Stack Developer",
    ],
    "Product": [
        "Product Manager", "Product Owner", "UX Designer", "Business Analyst",
    ],
    "Quality Assurance": [
        "QA Engineer", "Senior QA Engineer", "Automation Tester", "QA Lead",
    ],
    "Human Resources": [
        "HR Specialist", "Recruitment Specialist", "Training Coordinator", "HR Generalist",
    ],
    "Finance": [
        "Financial Analyst", "Accountant", "Senior Accountant", "Budget Analyst",
    ],
    "Medical": [
        "General Practitioner", "Specialist Doctor", "Medical Supervisor", "Radiologist",
    ],
    "Nursing": [
        "Registered Nurse", "Senior Nurse", "Charge Nurse", "ICU Nurse",
    ],
    "Administration": [
        "Administrative Assistant", "Office Manager", "Receptionist", "Coordinator",
    ],
    "Sales": [
        "Sales Representative", "Account Manager", "Sales Manager", "Key Account Executive",
    ],
    "Operations": [
        "Operations Manager", "Operations Analyst", "Project Manager", "Process Improvement Specialist",
    ],
    "Logistics": [
        "Logistics Coordinator", "Supply Chain Analyst", "Warehouse Manager", "Fleet Coordinator",
    ],
}

ADDRESSES = [
    "12 El-Tahrir Square, Cairo",
    "45 Corniche Road, Alexandria",
    "7 Al-Zamalek Street, Cairo",
    "23 Salah Salem Road, Cairo",
    "88 Smouha District, Alexandria",
    "3 Garden City, Cairo",
    "16 Maadi Ring Road, Cairo",
    "5 Heliopolis Street, Cairo",
    "30 Nasr City, Cairo",
    "11 October 6th City, Giza",
    "9 Dokki Square, Giza",
    "22 Mohandessin, Giza",
    "14 New Cairo, Cairo",
    "6 Sheraton District, Cairo",
    "19 Agami Beach Road, Alexandria",
]

MOBILE_PREFIXES = ["010", "011", "012", "015"]

ONBOARDING_WEIGHTS = {
    "hired": 0.60,
    "application_received": 0.15,
    "interview_scheduled": 0.15,
    "not_accepted": 0.10,
}


def random_mobile():
    prefix = random.choice(MOBILE_PREFIXES)
    return f"{prefix}{random.randint(10_000_000, 99_999_999)}"


def random_hire_date():
    days_ago = random.randint(30, 1460)
    return date.today() - timedelta(days=days_ago)


def weighted_onboarding():
    r = random.random()
    cumulative = 0.0
    for status, weight in ONBOARDING_WEIGHTS.items():
        cumulative += weight
        if r < cumulative:
            return status
    return "hired"


class Command(BaseCommand):
    help = "Seed the database with realistic Arabic-named employees, departments, and companies"

    def add_arguments(self, parser):
        parser.add_argument(
            "--employees-per-dept",
            type=int,
            default=4,
            help="Number of employees to create per department (default: 4)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear all existing seed data before seeding",
        )

    def handle(self, *args, **options):
        employees_per_dept = options["employees_per_dept"]
        clear = options["clear"]

        if clear:
            self._clear_data()

        with transaction.atomic():
            self._create_superadmin()
            all_names = MALE_NAMES + FEMALE_NAMES
            name_pool = all_names.copy()
            random.shuffle(name_pool)
            name_index = [0]

            for company_data in COMPANIES:
                company = self._get_or_create_company(company_data["name"])
                hr_manager = self._get_or_create_hr_manager(company, company_data["domain"])
                dept_names = DEPARTMENTS[company_data["name"]]

                for dept_name in dept_names:
                    department = self._get_or_create_department(dept_name, company)
                    titles = TITLES_BY_DEPARTMENT.get(dept_name, ["Specialist"])

                    for _ in range(employees_per_dept):
                        name = self._next_name(name_pool, name_index, all_names)
                        self._create_employee(name, company, department, titles, company_data["domain"])

        self.stdout.write(self.style.SUCCESS("Seeding complete."))

    def _clear_data(self):
        self.stdout.write("Clearing existing seed data...")
        Employee.objects.all().delete()
        User.objects.filter(role__in=["hr_manager", "employee"]).delete()
        Department.objects.all().delete()
        Company.objects.all().delete()
        self.stdout.write(self.style.WARNING("Cleared companies, departments, employees, and non-admin users."))

    def _create_superadmin(self):
        if not User.objects.filter(email="admin@system.com").exists():
            User.objects.create_superuser(email="admin@system.com", password="Admin@1234")
            self.stdout.write(self.style.SUCCESS("  Created superadmin: admin@system.com / Admin@1234"))
        else:
            self.stdout.write("  Superadmin already exists, skipping.")

    def _get_or_create_company(self, name):
        company, created = Company.objects.get_or_create(name=name)
        if created:
            self.stdout.write(self.style.SUCCESS(f"  Created company: {name}"))
        else:
            self.stdout.write(f"  Company already exists: {name}")
        return company

    def _get_or_create_hr_manager(self, company, domain):
        email = f"hr@{domain}"
        if User.objects.filter(email=email).exists():
            return User.objects.get(email=email)

        user = User.objects.create_user(
            email=email,
            password="HrManager@1234",
            role="hr_manager",
        )
        user.company = company
        user.save()
        self.stdout.write(self.style.SUCCESS(f"    Created HR manager: {email} / HrManager@1234"))
        return user

    def _get_or_create_department(self, name, company):
        dept, created = Department.objects.get_or_create(name=name, company=company)
        if created:
            self.stdout.write(self.style.SUCCESS(f"    Created department: {name}"))
        return dept

    def _next_name(self, pool, index, fallback):
        if index[0] >= len(pool):
            pool[:] = fallback.copy()
            random.shuffle(pool)
            index[0] = 0
        name = pool[index[0]]
        index[0] += 1
        return name

    def _create_employee(self, name, company, department, titles, domain):
        slug = name.lower().replace(" ", ".")
        base_email = f"{slug}@{domain}"
        email = base_email
        counter = 1
        while User.objects.filter(email=email).exists() or Employee.objects.filter(email=email).exists():
            email = f"{slug}{counter}@{domain}"
            counter += 1

        onboarding = weighted_onboarding()
        status = "active" if onboarding == "hired" else "inactive"

        user = User.objects.create_user(
            email=email,
            password="Employee@1234",
            role="employee",
        )
        user.company = company
        user.is_active = status == "active"
        user.save()

        Employee.objects.create(
            user=user,
            company=company,
            department=department,
            name=name,
            email=email,
            mobile=random_mobile(),
            address=random.choice(ADDRESSES),
            title=random.choice(titles),
            hire_date=random_hire_date(),
            status=status,
            onboarding_status=onboarding,
        )
        self.stdout.write(f"      + {name} ({department.name}) [{onboarding}]")
