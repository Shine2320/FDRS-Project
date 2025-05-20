from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt import views as jwt_views
from .views import HomeView, LogoutView
from Donors import urls

urlpatterns = [
    path("home/", HomeView.as_view()),
    path("donor/", include(urls)),
    path("logout/", LogoutView.as_view()),
    path(
        "auth/token/", jwt_views.TokenObtainPairView.as_view(), name="token_obtain_pair"
    ),
    path(
        "auth/token/refresh/",
        jwt_views.TokenRefreshView.as_view(),
        name="token_refresh",
    ),
]
