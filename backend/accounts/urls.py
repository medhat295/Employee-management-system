from django.urls import path
from .views import HRManagerDetailView, LoginView, LogoutView, RefreshView, UserListCreateView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', HRManagerDetailView.as_view(), name='hr-manager-detail'),
]
