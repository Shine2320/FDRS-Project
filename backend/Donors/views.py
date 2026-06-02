from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, DonorUserSerializer, InventorySerializer
from .models import User,Inventory
from .services import refresh_expired_inventory
from NGO.models import Orders
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated


@permission_classes([AllowAny])
# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class DonorUserListView(APIView):
    def get(self,request):
        if request.user.is_staff or request.user.role == User.ADMIN:
            permission_classes([IsAdminUser])
            user = User.objects.filter(
                role=User.DONOR, deleted_at__isnull=True
            ).select_related("donor")
            serializer_class = DonorUserSerializer(user, many=True)
            return Response(serializer_class.data)
        else:
            user = User.objects.filter(pk=request.user.pk, deleted_at__isnull=True)
            serializer = DonorUserSerializer(user, many=True)
            return Response(serializer.data)

    def put(self,request):
        user = User.objects.get(pk=request.user.pk)
        serializer = DonorUserSerializer(user,data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)






class InventoryView(APIView):
    def get(self, request):
        refresh_expired_inventory()
        if request.user.role == User.NGO:
            inventory = Inventory.objects.filter(
                status=Inventory.AVAILABLE,
                quantity__gt=0,
            )
            serializer = InventorySerializer(inventory, many=True)
            return Response(serializer.data)
        if request.user.role in [User.STAFF, User.ADMIN]:
            # User has one of the specified roles
            inventory = Inventory.objects.all()
            serializer = InventorySerializer(inventory, many=True)
            return Response(serializer.data)
        else:
            inventory = Inventory.objects.filter(donor_id=request.user.donor.donor_id)
            serializer = InventorySerializer(inventory, many=True)
            return Response(serializer.data)

    def post(self, request):
        serializer = InventorySerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            inv = serializer.save()
            return Response(InventorySerializer(inv).data,
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)
    def put(self, request, pk):
        inventory = Inventory.objects.get(pk=pk)
        serializer = InventorySerializer(inventory, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DonorImpactView(APIView):
    def get(self, request):
        if request.user.role != User.DONOR:
            return Response(status=status.HTTP_403_FORBIDDEN)
        orders = Orders.objects.filter(
            inventory_id__donor_id=request.user.donor,
            status=Orders.DELIVERED,
        )
        return Response(
            {
                "delivered_orders": orders.count(),
                "delivered_quantity": sum(order.quantity for order in orders),
            }
        )


