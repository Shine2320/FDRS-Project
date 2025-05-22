from django.contrib import admin
from django.urls import path
from .views import RegisterView,DriverUserListView,DriverStatusUpdateView

urlpatterns = [
    path("register/", RegisterView.as_view()),
path("list/", DriverUserListView.as_view()),
    path("<int:pk>/update-status/", DriverStatusUpdateView.as_view()),
]
