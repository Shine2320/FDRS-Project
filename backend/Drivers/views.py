from django.utils import timezone

from django.db import transaction
from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from NGO.models import Orders
from Main.models import Notification
from Main.services import create_notification, create_staff_notifications
from .serializers import RegisterSerializer, DriverUserSerializer, DeliverySerializer
from .models import User, Deliveries
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated


# Create your views here.
@permission_classes([AllowAny])
# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class DriverUserListView(APIView):
    def get(self,request):
        if request.user.role in [User.STAFF, User.ADMIN]:
            user = User.objects.filter(
                role=User.DRIVER, deleted_at__isnull=True
            ).select_related("driver")
            serializer_class = DriverUserSerializer(user, many=True)
            return Response(serializer_class.data)
        else:
            user = User.objects.filter(pk=request.user.pk, deleted_at__isnull=True)
            serializer = DriverUserSerializer(user, many=True)
            return Response(serializer.data)

    def put(self,request):
        user = User.objects.get(pk=request.user.pk)
        serializer = DriverUserSerializer(user,data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeliveryView(APIView):
    def get(self,request,pk=None):
        if pk is not None:
            delivery = Deliveries.objects.get(pk=pk)
            serializer = DeliverySerializer(delivery)
            return Response(serializer.data)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)
    def post(self,request):
        serializer = DeliverySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        # 1) Fetch the delivery for this order or 404
        delivery = get_object_or_404(Deliveries, order_id=pk)
        order = delivery.order_id
        try:
            new_status = int(request.data.get('status'))
        except (TypeError, ValueError):
            return Response(
                {'status': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        inventory = order.inventory_id
        # 2) Compute timestamps
        now = timezone.now()

        # 3) Apply business logic
        if new_status == Deliveries.IN_TRANSIT:
            delivery.status = new_status
            delivery.pickup_time = now
            create_notification(
                order.ngo_id.login_id,
                "Food picked up",
                f"Order #{order.order_id} is in transit.",
                Notification.DELIVERY_PICKED_UP,
            )
            create_staff_notifications(
                "Food picked up",
                f"Order #{order.order_id} is in transit.",
                Notification.DELIVERY_PICKED_UP,
            )

        elif new_status == Deliveries.DELIVERED:
            delivery.status = new_status
            delivery.delivery_time = now
            order.status = Orders.DELIVERED
            create_notification(
                order.ngo_id.login_id,
                "Delivery completed",
                f"Order #{order.order_id} was delivered.",
                Notification.DELIVERY_DELIVERED,
            )
            create_notification(
                order.inventory_id.donor_id.login_id,
                "Donation delivered",
                f"Order #{order.order_id} was delivered successfully.",
                Notification.DELIVERY_DELIVERED,
            )
            create_staff_notifications(
                "Delivery completed",
                f"Order #{order.order_id} was delivered.",
                Notification.DELIVERY_DELIVERED,
            )

        elif new_status == Deliveries.FAILED:
            delivery.status = new_status
            # restock the inventory

            inventory.quantity = inventory.quantity + order.quantity
            inventory.status = inventory.AVAILABLE
            order.status = Orders.FAILED
            create_notification(
                order.ngo_id.login_id,
                "Delivery failed",
                f"Order #{order.order_id} delivery failed.",
                Notification.DELIVERY_FAILED,
            )
            create_staff_notifications(
                "Delivery failed",
                f"Order #{order.order_id} delivery failed.",
                Notification.DELIVERY_FAILED,
            )

        else:
            return Response(
                {'status': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4) Save everything in one atomic block
        with transaction.atomic():
            order.save()
            # if you modified inventory:
            if new_status == Deliveries.FAILED:
                inventory.save(update_fields=["quantity", "status"])
            delivery.save()

        # 5) Serialize & return the updated delivery
        serializer = DeliverySerializer(delivery)
        return Response(serializer.data, status=status.HTTP_200_OK)
