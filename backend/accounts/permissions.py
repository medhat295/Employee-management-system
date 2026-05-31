from rest_framework.permissions import BasePermission
from .models import User


class IsAdmin(BasePermission):
    message = 'Access restricted to admin users only.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


class IsHRManager(BasePermission):
    message = 'Access restricted to HR managers only.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.HR_MANAGER
        )


class IsAdminOrHRManager(BasePermission):
    message = 'Access restricted to admin or HR manager users.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (User.Role.ADMIN, User.Role.HR_MANAGER)
        )
