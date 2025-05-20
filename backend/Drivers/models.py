import datetime

from django.db import models

from phonenumber_field.modelfields import PhoneNumberField

from Main.models import User


# Create your models here.
class Driver(models.Model):
    driver_id = models.BigAutoField(primary_key=True)
    login_id = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    contact_number = PhoneNumberField()
    vehicle = models.TextField()


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
        Driver, on_delete=models.CASCADE, db_column="driver_id"
    )
    pickup_time = models.DateTimeField(default=datetime.datetime.now)
    delivery_time = models.DateTimeField()
    status = models.IntegerField(choices=STATUS_TYPE, default=PENDING)
