import datetime

from django.db import models

from Drivers.models import Deliveries
from Main.models import User
from phonenumber_field.modelfields import PhoneNumberField

from NGO.models import Orders


# Create your models here.
class Donor(models.Model):
    donor_id = models.BigAutoField(primary_key=True)
    login_id = models.OneToOneField(User, on_delete=models.CASCADE,related_name='donor')
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
    PACKED = 0
    NON_PACKED = 1
    FOOD_TYPES = (
        (PACKED, "Packed"),
        (NON_PACKED, "Non-packed"),
    )
    inventory_id = models.BigAutoField(primary_key=True)
    donor_id = models.ForeignKey(Donor, on_delete=models.CASCADE, db_column="donor_id",related_name='donor')
    food_type = models.SmallIntegerField(choices=FOOD_TYPES, default=PACKED)
    item_name = models.CharField(max_length=200, default='')
    quantity = models.IntegerField()
    expiration_date = models.DateField()
    status = models.SmallIntegerField(choices=STATUS_TYPE, default=AVAILABLE)



