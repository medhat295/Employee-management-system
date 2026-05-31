from django.db import transaction
from rest_framework import serializers

from accounts.models import User
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)
    company_id = serializers.IntegerField(read_only=True)
    department_id = serializers.IntegerField(read_only=True)
    days_employed = serializers.IntegerField(read_only=True)

    class Meta:
        model = Employee
        fields = (
            'id', 'user_id',
            'company', 'company_id',
            'department', 'department_id',
            'name', 'email', 'mobile', 'address', 'title', 'hire_date',
            'status', 'days_employed', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'company': {'write_only': True},
            'department': {'write_only': True},
        }

    def validate(self, attrs):
        company = attrs.get('company')
        department = attrs.get('department')

        # For partial updates, fall back to the existing instance values
        if self.instance:
            company = company or self.instance.company
            department = department or self.instance.department

        if company and department and department.company_id != company.id:
            raise serializers.ValidationError(
                {'department': 'Department does not belong to the selected company.'}
            )
        return attrs


class EmployeeCreateSerializer(EmployeeSerializer):
    initial_password = serializers.CharField(write_only=True, min_length=8)

    class Meta(EmployeeSerializer.Meta):
        fields = EmployeeSerializer.Meta.fields + ('initial_password',)

    @transaction.atomic
    def create(self, validated_data):
        initial_password = validated_data.pop('initial_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=initial_password,
            role=User.Role.EMPLOYEE,
            company=validated_data['company'],
        )
        return Employee.objects.create(user=user, **validated_data)
