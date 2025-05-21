from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt import views as jwt_views

import Donors.urls
import Drivers.urls
import NGO.urls
import Staff.urls
from .views import HomeView, LogoutView, CustomTokenObtainPairView,CustomTokenRefreshView
import Donors, NGO, Staff, Drivers


urlpatterns = [
    path("home/", HomeView.as_view()),
    path("donor/", include(Donors.urls)),
    path("driver/", include(Drivers.urls)),
    path("ngo/", include(NGO.urls)),
    path("staff/", include(Staff.urls)),
    path("logout/", LogoutView.as_view()),
    path("auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(
        "auth/token/refresh/",
        CustomTokenRefreshView.as_view(),
        name="token_refresh",
    ),
]
