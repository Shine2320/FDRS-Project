from django.contrib import admin

from .models import Staff


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ("staff_id", "name", "login_id", "contact_number", "address")
    search_fields = ("name", "login_id__email", "contact_number", "address")
    readonly_fields = ("staff_id",)
