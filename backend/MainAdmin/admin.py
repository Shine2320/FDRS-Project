from django.contrib import admin

from .models import Reports


@admin.register(Reports)
class ReportsAdmin(admin.ModelAdmin):
    list_display = (
        "report_id",
        "generated_by",
        "report_type",
        "start_date",
        "end_date",
        "batch_key",
        "generated_at",
    )
    list_filter = ("report_type", "start_date", "end_date", "generated_at")
    search_fields = ("generated_by__email", "batch_key")
    readonly_fields = ("report_id", "batch_key", "generated_at")
