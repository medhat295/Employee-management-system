from django.db import models
from django.utils import timezone


class Employee(models.Model):
    class Status(models.TextChoices):
        ACTIVE   = 'active',   'Active'
        INACTIVE = 'inactive', 'Inactive'

    class OnboardingStatus(models.TextChoices):
        APPLICATION_RECEIVED = 'application_received', 'Application Received'
        INTERVIEW_SCHEDULED  = 'interview_scheduled',  'Interview Scheduled'
        HIRED                = 'hired',                'Hired'
        NOT_ACCEPTED         = 'not_accepted',         'Not Accepted'

    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='employee_profile',
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='employees',
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.CASCADE,
        related_name='employees',
    )
    name    = models.CharField(max_length=255)
    email   = models.EmailField(unique=True)
    mobile  = models.CharField(max_length=50)
    address = models.CharField(max_length=500, blank=True, default='')
    title   = models.CharField(max_length=255)
    hire_date = models.DateField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE,
    )
    onboarding_status = models.CharField(
        max_length=30,
        choices=OnboardingStatus.choices,
        default=OnboardingStatus.APPLICATION_RECEIVED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name} ({self.title})'

    @property
    def days_employed(self):
        return (timezone.now().date() - self.hire_date).days
