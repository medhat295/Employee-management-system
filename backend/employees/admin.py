from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'title', 'company', 'department', 'status', 'hire_date', 'days_employed')
    list_filter = ('status', 'company', 'department')
    search_fields = ('name', 'email', 'mobile', 'title')
    ordering = ('-hire_date',)
    readonly_fields = ('days_employed', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('user', 'name', 'email', 'mobile', 'address', 'title')}),
        ('Organisation', {'fields': ('company', 'department', 'status', 'hire_date')}),
        ('Timestamps', {'fields': ('days_employed', 'created_at', 'updated_at')}),
    )
