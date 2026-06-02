# accounts/serializers.py

from django.utils import timezone
from rest_framework import serializers
from .models import User, Donor,Inventory
from Main.models import Notification
from Main.services import create_staff_notifications, create_notification


class DonorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donor
        fields = ["name", "contact_number", "address"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    donor = DonorSerializer(required=False)

    class Meta:
        model = User
        fields = ["email", "password", "role", "donor"]

    def create(self, validated_data):
        donor_data = validated_data.pop("donor", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        Donor.objects.create(login_id=user, **donor_data)

        return user

class DonorUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="donor.name")
    address = serializers.CharField(source="donor.address")
    contact_number = serializers.CharField(
        source="donor.contact_number"
    )
    donor_id = serializers.CharField(source="donor.donor_id", read_only=True)

    class Meta:
        model = User
        fields = [
            "donor_id",
            "email",
            "role",
            "name",
            "contact_number",
            "is_active",
            "id",
            "address",
        ]

    def update(self, instance, validated_data):
        # 1) Pop off nested donor data
        donor_data = validated_data.pop("donor", {})

        # 2) Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 3) Update Donor fields
        donor = instance.donor
        for attr, value in donor_data.items():
            setattr(donor, attr, value)
        donor.save()

        return instance

class InventorySerializer(serializers.ModelSerializer):
    address = serializers.CharField(source="donor_id.address",read_only=True)
    contact_number = serializers.CharField(source="donor_id.contact_number",read_only=True)

    class Meta:
        model = Inventory
        fields = (
            'inventory_id',
            'food_type',
            'quantity',
            'expiration_date',
            'status',
            'item_name',
            'address',
            'contact_number'
        )
        read_only_fields = ('inventory_id','address','contact_number',)

    def create(self, validated_data):
        # grab the logged-in user’s donor record
        donor = self.context['request'].user.donor
        # create the Inventory row, wiring in donor_id automatically
        inventory = Inventory.objects.create(donor_id=donor, **validated_data)
        if inventory.status == Inventory.AVAILABLE:
            recipients = User.objects.filter(
                role=User.NGO,
                is_active=True,
                deleted_at__isnull=True,
            )
            donor_name = donor.name or donor.login_id.email
            item_name = inventory.item_name or "Donation"
            for recipient in recipients:
                create_notification(
                    recipient,
                    "New donation available",
                    f"{item_name} is available from {donor_name}.",
                    Notification.DONATION_AVAILABLE,
                )
            create_staff_notifications(
                "New donation available",
                f"{item_name} is available from {donor_name}.",
                Notification.DONATION_AVAILABLE,
            )
        return inventory

    def validate(self, attrs):
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", None))
        expiration_date = attrs.get(
            "expiration_date", getattr(self.instance, "expiration_date", None)
        )
        errors = {}
        if quantity is not None and quantity <= 0:
            errors["quantity"] = "Quantity must be greater than zero."
        if expiration_date and expiration_date < timezone.localdate():
            errors["expiration_date"] = "Expiration date must be today or in the future."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
