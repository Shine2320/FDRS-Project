from django.contrib import admin

from .models import NGO, Orders


@admin.register(NGO)
class NGOAdmin(admin.ModelAdmin):
    list_display = (
        "ngo_id",
        "organization_name",
        "login_id",
        "contact_number",
        "address",
    )
    search_fields = (
        "organization_name",
        "login_id__email",
        "contact_number",
        "address",
    )
    readonly_fields = ("ngo_id",)


@admin.register(Orders)
class OrdersAdmin(admin.ModelAdmin):
    list_display = (
        "order_id",
        "ngo_id",
        "inventory_id",
        "quantity",
        "status",
        "feedback_rating",
        "created_on",
    )
    list_filter = ("status", "created_on", "feedback_rating")
    search_fields = (
        "ngo_id__organization_name",
        "ngo_id__login_id__email",
        "inventory_id__item_name",
    )
    readonly_fields = ("order_id", "created_on", "feedback_submitted_at")
