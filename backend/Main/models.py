from django.utils import timezone

from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.ADMIN)
        return self.create_user(email, password, **extra_fields)


# Create your models here.
class User(AbstractBaseUser, PermissionsMixin):
    DONOR = 0
    NGO = 1
    STAFF = 2
    ADMIN = 3
    DRIVER = 4
    ROLE_TYPE = (
        (ADMIN, "admin"),
        (NGO, "ngo"),
        (STAFF, "staff"),
        (DONOR, "donor"),
        (DRIVER, "driver"),
    )
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True, blank=True)
    role = models.SmallIntegerField(null=True, blank=True, choices=ROLE_TYPE)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    objects = CustomUserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def has_perm(self, perm, obj=None):
        if self.is_active and (self.is_superuser or self.role == self.ADMIN):
            return True
        return super().has_perm(perm, obj)

    def has_module_perms(self, app_label):
        if self.is_active and (self.is_superuser or self.role == self.ADMIN):
            return True
        return super().has_module_perms(app_label)


class Notification(models.Model):
    ORDER_CREATED = "order_created"
    ORDER_APPROVED = "order_approved"
    ORDER_CANCELLED = "order_cancelled"
    DELIVERY_PICKED_UP = "delivery_picked_up"
    DELIVERY_DELIVERED = "delivery_delivered"
    DELIVERY_FAILED = "delivery_failed"
    EVENT_TYPE = (
        (ORDER_CREATED, "Order Created"),
        (ORDER_APPROVED, "Order Approved"),
        (ORDER_CANCELLED, "Order Cancelled"),
        (DELIVERY_PICKED_UP, "Delivery Picked Up"),
        (DELIVERY_DELIVERED, "Delivery Delivered"),
        (DELIVERY_FAILED, "Delivery Failed"),
    )
    notification_id = models.BigAutoField(primary_key=True)
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    event_type = models.CharField(max_length=40, choices=EVENT_TYPE)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
