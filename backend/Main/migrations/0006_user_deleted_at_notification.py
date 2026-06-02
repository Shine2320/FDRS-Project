from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("Main", "0005_alter_user_created_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="deleted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                (
                    "notification_id",
                    models.BigAutoField(primary_key=True, serialize=False),
                ),
                ("title", models.CharField(max_length=150)),
                ("message", models.TextField()),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("order_created", "Order Created"),
                            ("order_approved", "Order Approved"),
                            ("order_cancelled", "Order Cancelled"),
                            ("delivery_picked_up", "Delivery Picked Up"),
                            ("delivery_delivered", "Delivery Delivered"),
                            ("delivery_failed", "Delivery Failed"),
                        ],
                        max_length=40,
                    ),
                ),
                ("is_read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to="Main.user",
                    ),
                ),
            ],
        ),
    ]
