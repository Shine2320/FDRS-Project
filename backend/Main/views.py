from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.utils import timezone

from .models import Notification, User
from .serializers import (
    CustomTokenObtainPairSerializer,
    CustomTokenRefreshSerializer,
    NotificationSerializer,
)


def can_manage_users(user):
    return bool(user and (user.is_staff or user.role == User.ADMIN))


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer


class HomeView(APIView):

    def get(self, request):
        content = {
            "message": """Welcome to the JWT 
                   Authentication page using React Js and Django!"""
        }
        return Response(content)


@permission_classes([AllowAny])
class LogoutView(APIView):

    def post(self, request):

        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class UserStatusUpdateView(APIView):
    def patch(self, request, pk):
        if not can_manage_users(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk, deleted_at__isnull=True)
            is_active = request.data.get("is_active")
            user.is_active = is_active
            user.save()
            return Response({"status": "updated"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


class UserSoftDeleteView(APIView):
    def delete(self, request, pk):
        if not can_manage_users(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk, deleted_at__isnull=True)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        user.is_active = False
        user.deleted_at = timezone.now()
        user.save(update_fields=["is_active", "deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationListView(APIView):
    def get(self, request):
        notifications = Notification.objects.filter(recipient=request.user).order_by(
            "-created_at"
        )
        return Response(NotificationSerializer(notifications, many=True).data)


class NotificationReadView(APIView):
    def patch(self, request, pk):
        notification = Notification.objects.filter(
            pk=pk, recipient=request.user
        ).first()
        if not notification:
            return Response(
                {"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND
            )
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)
