from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from .serializers import RegisterSerializer, StaffUserSerializer
from .models import User
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from .models import Staff


# Create your views here.
@permission_classes([AllowAny])
# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


def ensure_staff_profile(user):
    if user.role != User.STAFF:
        return None
    staff, _ = Staff.objects.get_or_create(
        login_id=user,
        defaults={
            "name": user.email.split("@")[0],
            "contact_number": "+910000000000",
            "address": "",
        },
    )
    return staff


@permission_classes([IsAuthenticated])
class StaffUserListView(APIView):
    def get(self,request):
        if request.user.is_staff or request.user.role == User.ADMIN:
            permission_classes([IsAdminUser])
            user = User.objects.filter(
                role=User.STAFF, deleted_at__isnull=True
            )
            for staff_user in user:
                ensure_staff_profile(staff_user)
            user = user.select_related("staff")
            serializer_class = StaffUserSerializer(user, many=True)
            return Response(serializer_class.data)
        else:
            ensure_staff_profile(request.user)
            user = User.objects.filter(pk=request.user.pk, deleted_at__isnull=True).select_related("staff")
            serializer = StaffUserSerializer(user, many=True)
            return Response(serializer.data)

    def put(self,request):
        user = User.objects.get(pk=request.user.pk)
        ensure_staff_profile(user)
        serializer = StaffUserSerializer(user,data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
