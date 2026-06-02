from django.contrib import admin

from .models import Deliveries, Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = (
        "driver_id",
        "name",
        "login_id",
        "contact_number",
        "vehicle",
        "address",
    )
    search_fields = ("name", "login_id__email", "contact_number", "vehicle", "address")
    readonly_fields = ("driver_id",)


@admin.register(Deliveries)
class DeliveriesAdmin(admin.ModelAdmin):
    list_display = (
        "delivery_id",
        "driver_id",
        "order_id",
        "status",
        "pickup_time",
        "delivery_time",
    )
    list_filter = ("status", "pickup_time", "delivery_time")
    search_fields = (
        "driver_id__name",
        "driver_id__login_id__email",
        "order_id__order_id",
    )
    readonly_fields = ("delivery_id",)
