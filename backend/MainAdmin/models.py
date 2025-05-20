import datetime

from django.db import models
from Main.models import User


# Create your models here.
class Reports(models.Model):
    DONATION_SUMMARY = 0
    INVENTORY_STATUS = 1
    ORDER_SUMMARY = 2
    DELIVERY_EFFICIENCY = 3
    USER_ACTIVITY = 4
    REPORT_TYPE = (
        (DONATION_SUMMARY, "Donation Summary"),
        (INVENTORY_STATUS, "Inventory Status"),
        (ORDER_SUMMARY, "Order Summary"),
        (DELIVERY_EFFICIENCY, "Delivery Efficiency"),
        (USER_ACTIVITY, "User Activity"),
    )
    report_id = models.BigAutoField(primary_key=True)
    generated_by = models.ForeignKey(User,on_delete=models.CASCADE)
    report_type = models.IntegerField(choices=REPORT_TYPE, default=DONATION_SUMMARY)
    start_date = models.DateField()
    end_date = models.DateField()
    data = models.JSONField()
    generated_at = models.DateTimeField(default=datetime.datetime.now)



