from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Main", "0006_user_deleted_at_notification"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="event_type",
            field=models.CharField(
                choices=[
                    ("order_created", "Order Created"),
                    ("order_approved", "Order Approved"),
                    ("order_cancelled", "Order Cancelled"),
                    ("delivery_picked_up", "Delivery Picked Up"),
                    ("delivery_delivered", "Delivery Delivered"),
                    ("delivery_failed", "Delivery Failed"),
                    ("donation_available", "Donation Available"),
                ],
                max_length=40,
            ),
        ),
    ]
