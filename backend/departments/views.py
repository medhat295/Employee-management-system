from rest_framework import mixins, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from accounts.permissions import IsAdminOrHRManager
from accounts.models import User
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    serializer_class = DepartmentSerializer
    permission_classes = (IsAuthenticated, IsAdminOrHRManager)

    def get_permissions(self):
        # Any authenticated user may retrieve a single department.
        # get_queryset already scopes non-admins to their own company.
        if self.action == 'retrieve':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrHRManager()]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return Department.objects.all().order_by('company', 'name')
        if user.role == User.Role.EMPLOYEE:
            return Department.objects.filter(employees__user=user).distinct()
        return Department.objects.filter(company=user.company).order_by('name')

    def _assert_company_access(self, company_id):
        user = self.request.user
        if user.role != User.Role.ADMIN and user.company_id != company_id:
            raise PermissionDenied('You can only manage departments within your own company.')

    def perform_create(self, serializer):
        self._assert_company_access(serializer.validated_data['company'].id)
        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        self._assert_company_access(instance.company_id)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        # Prevent reassigning department to a different company
        if 'company' in serializer.validated_data:
            self._assert_company_access(serializer.validated_data['company'].id)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self._assert_company_access(instance.company_id)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
