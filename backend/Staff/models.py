from django.db import models
from Main.models import User
from phonenumber_field.modelfields import PhoneNumberField


# Create your models here.
class Staff(models.Model):
    staff_id = models.BigAutoField(primary_key=True)
    login_id = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="staff"
    )
    name = models.CharField(max_length=100)
    contact_number = PhoneNumberField()
