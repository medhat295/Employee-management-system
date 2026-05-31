from rest_framework import mixins, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from accounts.permissions import IsAdmin
from .models import Company
from .serializers import CompanySerializer


class CompanyViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    queryset = Company.objects.all().order_by('name')
    serializer_class = CompanySerializer
    permission_classes = (IsAuthenticated, IsAdmin)

    def get_permissions(self):
        # Any authenticated user may retrieve a single company (scoped below).
        if self.action == 'retrieve':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Non-admin users can only view their own company.
        if request.user.role != 'admin' and request.user.company_id != instance.id:
            raise PermissionDenied('You can only view your own company.')
        return Response(self.get_serializer(instance).data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
