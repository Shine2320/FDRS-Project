from django.contrib import admin
from django.urls import path
from .views import RegisterView, DriverUserListView, DeliveryView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("list/", DriverUserListView.as_view()),
    path("", DriverUserListView.as_view()),
    path("Delivery/", DeliveryView.as_view()),
    path("Delivery/<int:pk>/", DeliveryView.as_view()),
]
