from django.contrib import admin
from django.contrib import messages
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Notification, User

DEFAULT_RESET_PASSWORD = "Fdrs@12345"


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    list_display = (
        "id",
        "email",
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
        "created_at",
        "deleted_at",
    )
    list_filter = ("role", "is_active", "is_staff", "is_superuser", "deleted_at")
    search_fields = ("email",)
    ordering = ("id",)
    readonly_fields = ("last_login", "created_at", "password_hash")
    actions = ("reset_password_to_default",)

    fieldsets = (
        (None, {"fields": ("email", "password", "password_hash")}),
        (
            "Permissions",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                    "deleted_at",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "created_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

    # Raw passwords are never stored; Django keeps only this salted hash.
    def password_hash(self, obj):
        return obj.password

    @admin.action(description="Reset selected users password to Fdrs@12345")
    def reset_password_to_default(self, request, queryset):
        for user in queryset:
            user.set_password(DEFAULT_RESET_PASSWORD)
            user.save(update_fields=["password"])
        self.message_user(
            request,
            f"Password reset for {queryset.count()} user(s). Temporary password: {DEFAULT_RESET_PASSWORD}",
            messages.SUCCESS,
        )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "notification_id",
        "recipient",
        "title",
        "event_type",
        "is_read",
        "created_at",
    )
    list_filter = ("event_type", "is_read", "created_at")
    search_fields = ("recipient__email", "title", "message")
    readonly_fields = ("notification_id", "created_at")
