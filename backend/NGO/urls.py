from django.contrib import admin
from django.urls import path
from .views import RegisterView, NGOUserListView,NGOStatusUpdateView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("list/", NGOUserListView.as_view()),
    path("<int:pk>/update-status/", NGOStatusUpdateView.as_view()),
]
