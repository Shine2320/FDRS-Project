from django.db import models

from Main.models import User
from phonenumber_field.modelfields import PhoneNumberField


# Create your models here.
class NGO(models.Model):
    ngo_id = models.BigAutoField(primary_key=True)
    login_id = models.ForeignKey(User, on_delete=models.CASCADE)
    organization_name = models.CharField(max_length=150)
    contact_number = PhoneNumberField()
    address = models.TextField(null=True, blank=True)


class Orders(models.Model):
    PENDING = 0
    APPROVED = 1
    DELIVERED = 2
    CANCELLED = 3
    STATUS_TYPE = (
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (DELIVERED, "Delivered"),
        (CANCELLED, "Cancelled"),
    )
    order_id = models.BigAutoField(primary_key=True)
    ngo_id = models.ForeignKey(NGO, on_delete=models.CASCADE, db_column="ngo_id")
    inventory_id = models.ForeignKey(
        "Donors.Inventory", on_delete=models.CASCADE, db_column="inventory_id"
    )
    quantity = models.IntegerField()
    status = models.SmallIntegerField(choices=STATUS_TYPE, default=PENDING)
