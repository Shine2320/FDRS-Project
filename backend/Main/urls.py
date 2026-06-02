from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt import views as jwt_views

import Donors.urls
import Drivers.urls
import MainAdmin.urls
import NGO.urls
import Staff.urls
from .views import (
    HomeView,
    LogoutView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    UserStatusUpdateView,
    UserSoftDeleteView,
    NotificationListView,
    NotificationReadView,
)
import Donors, NGO, Staff, Drivers


urlpatterns = [
    path("home/", HomeView.as_view()),
    path("donor/", include(Donors.urls)),
    path("driver/", include(Drivers.urls)),
    path("ngo/", include(NGO.urls)),
    path("staff/", include(Staff.urls)),
    path("api/reports/", include(MainAdmin.urls)),
    path("logout/", LogoutView.as_view()),
    path("auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(
        "auth/token/refresh/",
        CustomTokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("<int:pk>/update-status/", UserStatusUpdateView.as_view()),
    path("users/<int:pk>/", UserSoftDeleteView.as_view()),
    path("notifications/", NotificationListView.as_view()),
    path("notifications/<int:pk>/read/", NotificationReadView.as_view()),
]
