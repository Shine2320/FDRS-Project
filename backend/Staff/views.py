from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from .serializers import RegisterSerializer, StaffUserSerializer
from .models import User
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework import status
from rest_framework.response import Response


# Create your views here.
@permission_classes([AllowAny])
# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


@permission_classes([IsAdminUser])
class StaffUserListView(generics.ListAPIView):
    queryset = User.objects.filter(role=User.STAFF).select_related("staff")
    serializer_class = StaffUserSerializer


@permission_classes([IsAdminUser])
class StaffStatusUpdateView(APIView):
    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            is_active = request.data.get("is_active")
            user.is_active = is_active
            user.save()
            return Response({"status": "updated"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )
