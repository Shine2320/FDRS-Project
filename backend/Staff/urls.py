from django.contrib import admin
from django.urls import path
from .views import RegisterView, StaffUserListView, StaffStatusUpdateView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("list/", StaffUserListView.as_view()),
    path("staff/<int:pk>/update-status/", StaffStatusUpdateView.as_view()),
]
