from django.db import transaction
from django.shortcuts import render
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from Drivers.models import Deliveries, Driver
from Donors.models import Inventory
from Donors.services import refresh_expired_inventory
from Main.models import Notification
from Main.services import create_notification, create_staff_notifications
from .serializers import (
    RegisterSerializer,
    NGOUserSerializer,
    OrderSerializer,
    FeedbackSerializer,
)
from .models import User, Orders
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated


def get_ngo_profile(user):
    if hasattr(user, "ngo"):
        return user.ngo
    return None


# Create your views here.
@permission_classes([AllowAny])
# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer




@permission_classes([IsAuthenticated])
class NGOUserListView(APIView):
    def get(self,request):
        if request.user.is_staff or request.user.role == User.ADMIN:
            permission_classes([IsAdminUser])
            user = User.objects.filter(
                role=User.NGO, deleted_at__isnull=True
            ).select_related("ngo")
            serializer_class = NGOUserSerializer(user, many=True)
            return Response(serializer_class.data)
        else:
            user = User.objects.filter(pk=request.user.pk, deleted_at__isnull=True)
            serializer = NGOUserSerializer(user, many=True)
            return Response(serializer.data)

    def put(self,request):
        user = User.objects.get(pk=request.user.pk)
        serializer = NGOUserSerializer(user,data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrderView(APIView):
    def get(self,request,pk=None):
        refresh_expired_inventory()
        if pk is not None:
            # Fetch order or return 404 if not found
            order = get_object_or_404(
                Orders.objects.select_related(
                    'inventory_id__donor_id',  # for donor
                    'ngo_id'  # for NGO
                ),
                pk=pk
            )

            # Try fetching related delivery (but don't throw an error)
            delivery = Deliveries.objects.filter(order_id=order).select_related('driver_id').first()

            # Base serialization of the Orders model fields
            base = OrderSerializer(order).data

            # Inject all read-only extras
            base.update({
                # Donor details
                'donor_name': order.inventory_id.donor_id.name,
                'donor_address': order.inventory_id.donor_id.address,
                'donor_contact_number': str(order.inventory_id.donor_id.contact_number),
                'donor_email': order.inventory_id.donor_id.login_id.email,

                # NGO details
                'ngo_name': order.ngo_id.organization_name,
                'ngo_address': order.ngo_id.address,
                'ngo_contact_number': str(order.ngo_id.contact_number),
                'ngo_email': order.ngo_id.login_id.email,
                'feedback_rating': order.feedback_rating,
                'feedback_comment': order.feedback_comment,
                'feedback_submitted_at': order.feedback_submitted_at,
            })

            # If delivery exists, add driver & delivery details
            if delivery:
                base.update({
                    'driver_name': delivery.driver_id.name,
                    'driver_vehicle': delivery.driver_id.vehicle,
                    'driver_contact_number': str(delivery.driver_id.contact_number),
                    'delivery_status': delivery.status,
                    'picked_up_time': delivery.pickup_time,
                    'delivery_time': delivery.delivery_time,
                })
            else:
                # If no delivery found, populate with `None` or default values
                base.update({
                    'driver_name': None,
                    'driver_vehicle': None,
                    'driver_contact_number': None,
                    'delivery_status': None,
                    'picked_up_time': None,
                    'delivery_time': None,
                })

            return Response(base, status=status.HTTP_200_OK)

        elif request.user.role in [User.STAFF, User.ADMIN]:
            orders = Orders.objects.all()
            serializer_class = OrderSerializer(orders, many=True)
            return Response(serializer_class.data)
        elif request.user.role == User.DONOR:
            orders = Orders.objects.filter(inventory_id__donor_id=request.user.donor)
            serializer_class = OrderSerializer(orders, many=True)
            return Response(serializer_class.data)
        elif request.user.role == User.DRIVER:
            # 1) Fetch deliveries for this driver
            deliveries = Deliveries.objects.filter(driver_id=request.user.driver)

            # 2) If none, return an empty list immediately
            if not deliveries.exists():
                return Response([], status=status.HTTP_200_OK)

            # 3) Otherwise, pull the related Order IDs and fetch Orders
            order_ids = deliveries.values_list('order_id', flat=True)
            orders_qs = Orders.objects.filter(order_id__in=order_ids)

            # 4) Serialize and return
            serializer = OrderSerializer(orders_qs, many=True)
            return Response(serializer.data)
        else:
            ngo = get_ngo_profile(request.user)
            if ngo is None:
                return Response(
                    {"ngo": "NGO profile is missing for this user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            orders = Orders.objects.filter(ngo_id=ngo.ngo_id)
            serializer_class = OrderSerializer(orders, many=True)
            return Response(serializer_class.data)

    def post(self,request):
        if request.user.role != User.NGO:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if get_ngo_profile(request.user) is None:
            return Response(
                {"ngo": "NGO profile is missing for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        refresh_expired_inventory()
        serializer = OrderSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            inv = serializer.save()
            create_notification(
                inv.inventory_id.donor_id.login_id,
                "New order request",
                f"Order #{inv.order_id} was requested for {inv.inventory_id.item_name}.",
                Notification.ORDER_CREATED,
            )
            create_staff_notifications(
                "New order request",
                f"Order #{inv.order_id} was requested for {inv.inventory_id.item_name}.",
                Notification.ORDER_CREATED,
            )
            return Response(OrderSerializer(inv).data,
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)

    def patch(self,request,pk):
        order = get_object_or_404(Orders, pk=pk)
        try:
            new_status = int(request.data.get('status'))
        except (TypeError, ValueError):
            return Response(
                {'status': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        with transaction.atomic():
            order = Orders.objects.select_for_update().get(pk=pk)
            inventory = Inventory.objects.select_for_update().get(
                pk=order.inventory_id.pk
            )
            if new_status == Orders.APPROVED:
                driver = Driver.objects.get(pk=request.data['driver_id'])
                order.status = Orders.APPROVED
                order.save(update_fields=["status"])
                Deliveries.objects.create(
                    order_id=order,
                    status=Deliveries.PENDING,
                    driver_id=driver,
                )
                create_notification(
                    order.ngo_id.login_id,
                    "Order approved",
                    f"Your order #{order.order_id} was approved.",
                    Notification.ORDER_APPROVED,
                )
                create_notification(
                    driver.login_id,
                    "Delivery assigned",
                    f"Order #{order.order_id} has been assigned to you.",
                    Notification.ORDER_APPROVED,
                )
                create_staff_notifications(
                    "Order approved",
                    f"Order #{order.order_id} was approved and assigned.",
                    Notification.ORDER_APPROVED,
                )
            elif new_status == Orders.CANCELLED:
                if order.status not in [Orders.CANCELLED, Orders.DELIVERED]:
                    inventory.quantity += order.quantity
                    inventory.status = Inventory.AVAILABLE
                    inventory.save(update_fields=["quantity", "status"])
                order.status = Orders.CANCELLED
                order.save(update_fields=["status"])
                delivery = Deliveries.objects.filter(order_id=order).first()
                if delivery:
                    delivery.status = Deliveries.FAILED
                    delivery.save(update_fields=["status"])
                create_notification(
                    order.inventory_id.donor_id.login_id,
                    "Order cancelled",
                    f"Order #{order.order_id} was cancelled.",
                    Notification.ORDER_CANCELLED,
                )
                create_notification(
                    order.ngo_id.login_id,
                    "Order cancelled",
                    f"Your order #{order.order_id} was cancelled.",
                    Notification.ORDER_CANCELLED,
                )
                create_staff_notifications(
                    "Order cancelled",
                    f"Order #{order.order_id} was cancelled.",
                    Notification.ORDER_CANCELLED,
                )
            else:
                return Response(
                    {'status': 'Invalid status'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


class OrderFeedbackView(APIView):
    def patch(self, request, pk):
        ngo = get_ngo_profile(request.user)
        if ngo is None:
            return Response(
                {"ngo": "NGO profile is missing for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order = get_object_or_404(Orders, pk=pk, ngo_id=ngo)
        if order.status != Orders.DELIVERED:
            return Response(
                {"error": "Feedback can be submitted after delivery only."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = FeedbackSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(feedback_submitted_at=timezone.now())
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

