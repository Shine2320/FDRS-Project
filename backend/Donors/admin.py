from django.contrib import admin

from .models import Donor, Inventory


@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ("donor_id", "name", "login_id", "contact_number", "address")
    search_fields = ("name", "login_id__email", "contact_number", "address")
    readonly_fields = ("donor_id",)


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = (
        "inventory_id",
        "item_name",
        "donor_id",
        "food_type",
        "quantity",
        "expiration_date",
        "status",
    )
    list_filter = ("food_type", "status", "expiration_date")
    search_fields = ("item_name", "donor_id__name", "donor_id__login_id__email")
    readonly_fields = ("inventory_id",)
