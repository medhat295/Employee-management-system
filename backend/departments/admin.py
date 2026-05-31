from django.contrib import admin
from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'active_employee_count', 'created_at')
    list_filter = ('company',)
    search_fields = ('name', 'company__name')
    ordering = ('company', 'name')
    readonly_fields = ('created_at', 'updated_at')
