import datetime

from django.db import models

from Drivers.models import Deliveries
from Main.models import User
from phonenumber_field.modelfields import PhoneNumberField

from NGO.models import Orders


# Create your models here.
class Donor(models.Model):
    donor_id = models.BigAutoField(primary_key=True)
    login_id = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    contact_number = PhoneNumberField()
    address = models.TextField(null=True, blank=True)


class Inventory(models.Model):
    AVAILABLE = 0
    RESERVED = 1
    EXPIRED = 2
    STATUS_TYPE = (
        (AVAILABLE, "Available"),
        (RESERVED, "Reserved"),
        (EXPIRED, "Expired"),
    )
    inventory_id = models.BigAutoField(primary_key=True)
    donor_id = models.ForeignKey(Donor, on_delete=models.CASCADE, db_column="donor_id")
    food_type = models.CharField(max_length=100)
    quantity = models.IntegerField()
    expiration_date = models.DateField()
    status = models.SmallIntegerField(choices=STATUS_TYPE, default=AVAILABLE)


class Donation(models.Model):
    donation_id = models.BigAutoField(primary_key=True)
    order_id = models.ForeignKey(Orders, on_delete=models.CASCADE, db_column="order_id")
    delivery_id = models.ForeignKey(
        Deliveries, on_delete=models.CASCADE, db_column="delivery_id"
    )
    donation_time = models.DateTimeField(default=datetime.datetime.now)
