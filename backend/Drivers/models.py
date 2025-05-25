import datetime

from django.db import models

from phonenumber_field.modelfields import PhoneNumberField

from Main.models import User
from NGO.models import Orders


# Create your models here.
class Driver(models.Model):
    driver_id = models.BigAutoField(primary_key=True)
    login_id = models.OneToOneField(User, on_delete=models.CASCADE,related_name="driver")
    name = models.CharField(max_length=100)
    contact_number = PhoneNumberField()
    vehicle = models.TextField()
    address = models.TextField(null=True, blank=True)


class Deliveries(models.Model):
    PENDING = 0
    IN_TRANSIT = 1
    DELIVERED = 2
    FAILED = 3
    STATUS_TYPE = (
        (PENDING, "Pending"),
        (IN_TRANSIT, "In Transit"),
        (DELIVERED, "Delivered"),
        (FAILED, "Failed"),
    )
    delivery_id = models.BigAutoField(primary_key=True)
    driver_id = models.ForeignKey(
        Driver, on_delete=models.CASCADE, db_column="driver_id",related_name="driver"
    )
    order_id = models.OneToOneField("NGO.Orders", on_delete=models.CASCADE, db_column="order_id",related_name="orders",null=True)
    pickup_time = models.DateTimeField(null=True, blank=True)
    delivery_time = models.DateTimeField(null=True, blank=True)
    status = models.IntegerField(choices=STATUS_TYPE, default=PENDING)
