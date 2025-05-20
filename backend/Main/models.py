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
    role = models.SmallIntegerField(null=True, blank=True, choices=ROLE_TYPE)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    objects = CustomUserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
