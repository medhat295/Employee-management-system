from django.shortcuts import get_object_or_404
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from accounts.models import User
from accounts.permissions import IsAdminOrHRManager
from .models import Employee
from .serializers import EmployeeSerializer, EmployeeCreateSerializer


class EmployeeViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        return EmployeeSerializer

    def get_permissions(self):
        if self.action in ('list', 'create', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdminOrHRManager()]
        # retrieve and me: authenticated only; object-level checks in each method
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Employee.objects.select_related('company', 'department')
        if self.action == 'list':
            if user.role == User.Role.HR_MANAGER:
                return qs.filter(company=user.company).order_by('name')
            return qs.order_by('company__name', 'name')
        # Detail actions use the full queryset; access is enforced inside each method
        return qs

    def _check_company_access(self, company_id):
        user = self.request.user
        if user.role != User.Role.ADMIN and user.company_id != company_id:
            raise PermissionDenied('You can only manage employees within your own company.')

    def perform_create(self, serializer):
        self._check_company_access(serializer.validated_data['company'].id)
        serializer.save()

    def retrieve(self, request, *args, **kwargs):
        instance = get_object_or_404(Employee, pk=kwargs['pk'])
        if request.user.role == User.Role.EMPLOYEE:
            if instance.user_id != request.user.id:
                raise PermissionDenied('You can only view your own profile.')
        else:
            self._check_company_access(instance.company_id)
        return Response(self.get_serializer(instance).data)

    def partial_update(self, request, *args, **kwargs):
        instance = get_object_or_404(Employee, pk=kwargs['pk'])
        self._check_company_access(instance.company_id)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if 'company' in serializer.validated_data:
            self._check_company_access(serializer.validated_data['company'].id)
        updated = serializer.save()

        # Keep User.is_active in sync with Employee.status
        new_status = serializer.validated_data.get('status')
        if new_status is not None:
            updated.user.is_active = (new_status == Employee.Status.ACTIVE)
            updated.user.save(update_fields=['is_active'])

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = get_object_or_404(Employee, pk=kwargs['pk'])
        self._check_company_access(instance.company_id)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        try:
            employee = request.user.employee_profile
        except Employee.DoesNotExist:
            raise NotFound('No employee profile found for this user.')
        return Response(self.get_serializer(employee).data)
