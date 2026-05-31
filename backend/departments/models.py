from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=255)
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='departments',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('name', 'company')

    def __str__(self):
        return f'{self.name} — {self.company}'

    @property
    def active_employee_count(self):
        return self.employees.filter(status='active').count()
