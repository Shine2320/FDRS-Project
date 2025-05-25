from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from Drivers.models import Deliveries, Driver
from .serializers import RegisterSerializer, NGOUserSerializer, OrderSerializer
from .models import User, Orders
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated


# Create your views here.
@permission_classes([AllowAny])
# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer




@permission_classes([IsAuthenticated])
class NGOUserListView(APIView):
    def get(self,request):
        if request.user.is_staff:
            permission_classes([IsAdminUser])
            user = User.objects.filter(role=User.NGO).select_related("ngo")
            serializer_class = NGOUserSerializer(user, many=True)
            return Response(serializer_class.data)
        else:
            user = User.objects.filter(pk=request.user.pk)
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
            orders = Orders.objects.filter(ngo_id=request.user.ngo.ngo_id)
            serializer_class = OrderSerializer(orders, many=True)
            return Response(serializer_class.data)

    def post(self,request):
        serializer = OrderSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            inv = serializer.save()
            return Response(OrderSerializer(inv).data,
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)

    def patch(self,request,pk):
        order = Orders.objects.get(pk=pk)
        if request.data['status'] == Orders.APPROVED:
            order.status = Orders.APPROVED
            driver = Driver.objects.get(pk=request.data['driver_id'])
            Deliveries.objects.create(order_id=order,status=Deliveries.PENDING,driver_id=driver).save()
        elif request.data['status'] == Orders.CANCELLED:
            order.status = Orders.CANCELLED
            order.inventory_id.quantity += order.quantity
            delivery = Deliveries.objects.filter(order_id=order).first()
            if delivery:
                Deliveries.objects.update(order_id=order,status=Deliveries.FAILED)

        serializer = OrderSerializer(order, data=request.data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(OrderSerializer(order).data,
                            status=status.HTTP_201_CREATED
                                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

