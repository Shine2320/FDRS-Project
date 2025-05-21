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
        except User.DoesNotExist:
            raise InvalidToken("User not found")

        data["access"] = str(access)
        return data
