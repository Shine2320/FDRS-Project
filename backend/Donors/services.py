from django.utils import timezone

from .models import Inventory


def refresh_expired_inventory():
    today = timezone.localdate()
    return Inventory.objects.filter(expiration_date__lt=today).exclude(
        status=Inventory.EXPIRED
    ).update(status=Inventory.EXPIRED)
