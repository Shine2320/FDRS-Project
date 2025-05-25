from django.contrib import admin
from django.urls import path
from .views import RegisterView, NGOUserListView, OrderView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("list/", NGOUserListView.as_view()),
    path("", NGOUserListView.as_view()),
    path("orders/", OrderView.as_view()),
    path("orders/<int:pk>/", OrderView.as_view()),

]
