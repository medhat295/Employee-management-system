from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from .models import Employee


VALID_TRANSITIONS: dict[str, set[str]] = {
    Employee.OnboardingStatus.APPLICATION_RECEIVED: {
        Employee.OnboardingStatus.INTERVIEW_SCHEDULED,
        Employee.OnboardingStatus.NOT_ACCEPTED,
    },
    Employee.OnboardingStatus.INTERVIEW_SCHEDULED: {
        Employee.OnboardingStatus.HIRED,
        Employee.OnboardingStatus.NOT_ACCEPTED,
    },
    Employee.OnboardingStatus.HIRED: {
        Employee.OnboardingStatus.NOT_ACCEPTED,
    },
    Employee.OnboardingStatus.NOT_ACCEPTED: {
        Employee.OnboardingStatus.APPLICATION_RECEIVED,
    },
}


class EmployeeSerializer(serializers.ModelSerializer):
    user_id       = serializers.IntegerField(read_only=True)
    company_id    = serializers.IntegerField(read_only=True)
    department_id = serializers.IntegerField(read_only=True)
    days_employed = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Employee
        fields = (
            'id', 'user_id',
            'company', 'company_id',
            'department', 'department_id',
            'name', 'email', 'mobile', 'address', 'title', 'hire_date',
            'status', 'onboarding_status',
            'days_employed', 'created_at', 'updated_at',
        )
        # onboarding_status is read-only here; use the /transition/ endpoint to advance it
        read_only_fields = ('id', 'onboarding_status', 'created_at', 'updated_at')
        extra_kwargs = {
            'company':    {'write_only': True},
            'department': {'write_only': True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            if not self.instance or self.instance.email != value:
                raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_mobile(self, value):
        digits = ''.join(ch for ch in value if ch.isdigit())
        if len(digits) != 11:
            raise serializers.ValidationError('Mobile number must contain exactly 11 digits.')
        return value

    def validate_hire_date(self, value):
        today = timezone.now().date()
        if value > today:
            raise serializers.ValidationError('Hire date cannot be in the future.')
        return value

    def validate(self, attrs):
        company    = attrs.get('company')
        department = attrs.get('department')

        if self.instance:
            company    = company    or self.instance.company
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
        is_active = validated_data.get('status', Employee.Status.ACTIVE) != Employee.Status.INACTIVE
        user = User.objects.create_user(
            email=validated_data['email'],
            password=initial_password,
            role=User.Role.EMPLOYEE,
            company=validated_data['company'],
            is_active=is_active,
        )
        return Employee.objects.create(user=user, **validated_data)


class TransitionSerializer(serializers.Serializer):
    """Validates that the requested onboarding_status transition is permitted."""

    onboarding_status = serializers.ChoiceField(
        choices=Employee.OnboardingStatus.choices,
    )

    def validate_onboarding_status(self, value):
        current = self.context.get('current_status', '')
        allowed = VALID_TRANSITIONS.get(current, set())
        if value not in allowed:
            if not allowed:
                detail = 'This is a final state — no further transitions are allowed.'
            else:
                detail = (
                    f"Cannot transition from '{current}' to '{value}'. "
                    f"Allowed: {', '.join(sorted(allowed))}."
                )
            raise serializers.ValidationError(detail)
        return value
