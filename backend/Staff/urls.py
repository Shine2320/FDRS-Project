from django.contrib import admin
from django.urls import path
from .views import RegisterView, StaffUserListView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("list/", StaffUserListView.as_view()),
path("", StaffUserListView.as_view()),
]
