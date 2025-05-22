from django.contrib import admin
from django.urls import path
from .views import RegisterView,DonorUserListView,DonorStatusUpdateView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("list/", DonorUserListView.as_view()),
    path("<int:pk>/update-status/", DonorStatusUpdateView.as_view()),
]
