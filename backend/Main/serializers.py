from django.core.exceptions import ObjectDoesNotExist
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from Main.models import Notification, User
from rest_framework_simplejwt.exceptions import InvalidToken


def get_related_display_name(user, related_name, display_field):
    try:
        related_object = getattr(user, related_name)
    except ObjectDoesNotExist:
        return None
    return getattr(related_object, display_field, None)


def get_user_display_name(user):
    if user.role == User.NGO:
        return get_related_display_name(user, "ngo", "organization_name") or user.email
    if user.role == User.DONOR:
        return get_related_display_name(user, "donor", "name") or user.email
    if user.role == User.STAFF:
        return get_related_display_name(user, "staff", "name") or user.email
    if user.role == User.DRIVER:
        return get_related_display_name(user, "driver", "name") or user.email
    if user.role == User.ADMIN:
        return "Admin"
    return user.email


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["role"] = user.role
        token["name"] = get_user_display_name(user)
        token["email"] = user.email  # optional

        return token


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = RefreshToken(attrs["refresh"])
        access = refresh.access_token
        data = {"access": str(access)}

        # Add custom claims to new access token
        user_id = refresh["user_id"]

        try:
            user = User.objects.get(id=user_id)
            access["role"] = user.role  # Add the role
            access["name"] = get_user_display_name(user)
            access["email"] = user.email
        except User.DoesNotExist:
            raise InvalidToken("User not found")

        data["access"] = str(access)
        return data


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "notification_id",
            "title",
            "message",
            "event_type",
            "is_read",
            "created_at",
        )
        read_only_fields = fields
