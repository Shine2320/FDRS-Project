from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from Main.models import User
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["role"] = user.role

        if user.role == User.NGO:
            token["name"] = user.ngo.organization_name
        elif user.role == User.DONOR:
            token["name"] = user.donor.name
        elif user.role == User.STAFF:
            token["name"] = user.staff.name
        elif user.role == User.STAFF:
            token["name"] = user.staff.name

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
            if user.role == User.NGO:
                access["name"] = user.ngo.organization_name
            elif user.role == User.DONOR:
                access["name"] = user.donor.name
            elif user.role == User.STAFF:
                access["name"] = user.staff.name
            elif user.role == User.STAFF:
                access["name"] = user.staff.name
        except User.DoesNotExist:
            raise InvalidToken("User not found")

        data["access"] = str(access)
        return data
