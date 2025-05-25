from django.contrib import admin
from django.urls import path
from .views import RegisterView, DonorUserListView, InventoryView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("list/", DonorUserListView.as_view()),
    path("", DonorUserListView.as_view()),
    path('inventory/', InventoryView.as_view(), name='inventory-list-create'),
    path('inventory/<int:pk>/', InventoryView.as_view(), name='inventory-update'),

]
