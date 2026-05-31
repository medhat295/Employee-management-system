from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    total_departments = serializers.IntegerField(read_only=True)
    total_employees = serializers.IntegerField(read_only=True)

    class Meta:
        model = Company
        fields = ('id', 'name', 'logo', 'total_departments', 'total_employees', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
