from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    active_employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = ('id', 'name', 'company', 'company_id', 'active_employee_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'company': {'write_only': True},
        }
