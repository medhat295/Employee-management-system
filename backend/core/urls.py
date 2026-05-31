from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include(('accounts.urls', 'auth'), namespace='auth')),
    path('api/accounts/', include(('accounts.urls', 'accounts'), namespace='accounts')),
    path('api/', include('companies.urls')),
    path('api/', include('departments.urls')),
    path('api/', include('employees.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
