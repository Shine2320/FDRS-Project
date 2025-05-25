from django.db import models
from django.utils import timezone

from Main.models import User
from phonenumber_field.modelfields import PhoneNumberField


# Create your models here.
class NGO(models.Model):
    ngo_id = models.BigAutoField(primary_key=True)
    login_id = models.OneToOneField(User, on_delete=models.CASCADE,related_name='ngo')
    organization_name = models.CharField(max_length=150)
    contact_number = PhoneNumberField()
    address = models.TextField(null=True, blank=True)


class Orders(models.Model):
    PENDING = 0
    APPROVED = 1
    DELIVERED = 2
    CANCELLED = 3
    FAILED = 4
    STATUS_TYPE = (
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (DELIVERED, "Delivered"),
        (CANCELLED, "Cancelled"),
        (FAILED, "Failed"),
    )
    order_id = models.BigAutoField(primary_key=True)
    ngo_id = models.ForeignKey(NGO, on_delete=models.CASCADE, db_column="ngo_id")
    inventory_id = models.ForeignKey(
        "Donors.Inventory", on_delete=models.CASCADE, db_column="inventory_id",related_name="inventory"
    )
    quantity = models.IntegerField()
    status = models.SmallIntegerField(choices=STATUS_TYPE, default=PENDING)
    created_on = models.DateTimeField(default=timezone.now)
