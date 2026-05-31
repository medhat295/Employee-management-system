from django.contrib.auth import authenticate
from rest_framework import serializers
from companies.models import Company
from .models import User


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email    = attrs['email']
        password = attrs['password']

        user = authenticate(username=email, password=password)

        if not user:
            # authenticate() returns None for both wrong credentials AND inactive
            # users (is_active=False). Look up the user to tell them apart so we
            # can show the right message.
            try:
                candidate = User.objects.get(email=email)
                if candidate.check_password(password):
                    # Correct password but blocked — inactive account.
                    raise serializers.ValidationError(
                        'There is a problem with this account. Please contact your administrator.',
                        code='authorization',
                    )
            except User.DoesNotExist:
                pass
            raise serializers.ValidationError('Invalid email or password.', code='authorization')

        # Safety net: also catch employees whose is_active was never synced.
        employee_profile = getattr(user, 'employee_profile', None)
        if employee_profile is not None and employee_profile.status == 'inactive':
            raise serializers.ValidationError(
                'There is a problem with this account. Please contact your administrator.',
                code='authorization',
            )

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'company_id')


class HRManagerCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all())

    class Meta:
        model = User
        fields = ('email', 'password', 'company')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=User.Role.HR_MANAGER,
            company=validated_data['company'],
        )
