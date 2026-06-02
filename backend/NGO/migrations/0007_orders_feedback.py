from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("NGO", "0006_orders_created_on"),
    ]

    operations = [
        migrations.AddField(
            model_name="orders",
            name="feedback_rating",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="orders",
            name="feedback_comment",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="orders",
            name="feedback_submitted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
