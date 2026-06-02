# accounts/serializers.py
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from phonenumber_field.serializerfields import PhoneNumberField
from Donors.models import Inventory
from .models import User, NGO, Orders


class NGOSerializer(serializers.ModelSerializer):
    class Meta:
        model = NGO
        fields = ["organization_name", "contact_number", "address"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    ngo = NGOSerializer(required=False)

    class Meta:
        model = User
        fields = ["email", "password", "role", "ngo"]

    def create(self, validated_data):
        ngo_data = validated_data.pop("ngo", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()        
        NGO.objects.create(login_id=user, **ngo_data)

        return user

class NGOUserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="ngo.organization_name", )
    contact_number = serializers.CharField(
        source="ngo.contact_number",
    )
    ngo_id = serializers.CharField(source="ngo.ngo_id", read_only=True)
    address = serializers.CharField(source="ngo.address", )

    class Meta:
        model = User
        fields = [
            "ngo_id",
            "email",
            "role",
            "organization_name",
            "contact_number",
            "is_active",
            "id",'address'
        ]
    def update(self, instance, validated_data):
        # 1) Pop off nested donor data
        ngo_data = validated_data.pop("ngo", {})

        # 2) Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 3) Update Donor fields
        ngo = instance.ngo
        for attr, value in ngo_data.items():
            setattr(ngo, attr, value)
        ngo.save()

        return instance


class OrderSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="inventory_id.item_name", read_only=True)
    donor_name = serializers.CharField(read_only=True)
    donor_address = serializers.CharField(read_only=True)
    donor_contact_number = PhoneNumberField(read_only=True)
    donor_email = serializers.CharField(read_only=True)
    ngo_name = serializers.CharField(read_only=True)
    ngo_address = serializers.CharField(read_only=True)
    ngo_contact_number = PhoneNumberField(read_only=True)
    ngo_email = serializers.CharField(read_only=True)
    driver_name = serializers.CharField(read_only=True)
    driver_vehicle = serializers.CharField(read_only=True)
    driver_contact_number = PhoneNumberField(read_only=True)
    delivery_status = serializers.IntegerField(read_only=True)
    picked_up_time = serializers.DateTimeField(read_only=True)
    delivery_time = serializers.DateTimeField(read_only=True)
    class Meta:
        model = Orders
        fields = (
            'inventory_id',
            'status',
            'quantity',
            'order_id',
            'item_name',
            'donor_name',
            'donor_address',
            'donor_contact_number',
            'donor_email',
            'ngo_name',
            'ngo_address',
            'ngo_contact_number',
            'ngo_email',
            'driver_name',
            'driver_vehicle',
            'driver_contact_number',
            'delivery_status',
            'picked_up_time',
            'delivery_time',
            'created_on',
            'feedback_rating',
            'feedback_comment',
            'feedback_submitted_at',
        )
        read_only_fields = (
            'order_id',
            'item_name',
            'donor_name',
            'donor_address',
            'donor_contact_number',
            'donor_email',
            'ngo_name',
            'ngo_address',
            'ngo_contact_number',
            'ngo_email',
            'driver_name',
            'driver_vehicle',
            'driver_contact_number',
            'delivery_status',
            'picked_up_time',
            'delivery_time',
            'created_on',
            'feedback_rating',
            'feedback_comment',
            'feedback_submitted_at',
        )

    def validate(self, attrs):
        inventory = attrs.get("inventory_id")
        quantity = attrs.get("quantity")
        if quantity is not None and quantity <= 0:
            raise serializers.ValidationError(
                {"quantity": "Quantity must be greater than zero."}
            )
        if inventory and quantity:
            # Orders are only valid while food is still available and in stock.
            if inventory.status != Inventory.AVAILABLE:
                raise serializers.ValidationError(
                    {"inventory_id": "This inventory item is not available."}
                )
            if inventory.expiration_date < timezone.localdate():
                raise serializers.ValidationError(
                    {"inventory_id": "This inventory item has expired."}
                )
            if inventory.quantity < quantity:
                raise serializers.ValidationError(
                    {"quantity": "Quantity cannot exceed available inventory."}
                )
        return attrs


    def create(self, validated_data):
        inventory = validated_data.pop('inventory_id')
        qty = validated_data.pop('quantity')
        request = self.context.get('request')
        if request is None or not hasattr(request.user, 'ngo'):
            raise serializers.ValidationError(
                {"ngo": "NGO profile is missing for this user."}
            )
        ngo = request.user.ngo

        with transaction.atomic():
            inventory = Inventory.objects.select_for_update().get(pk=inventory.pk)
            if inventory.status != Inventory.AVAILABLE or inventory.quantity < qty:
                raise serializers.ValidationError(
                    {"inventory_id": "This inventory item is no longer available."}
                )
            inventory.quantity -= qty
            if inventory.quantity <= 0:
                inventory.status = Inventory.RESERVED
            inventory.save()

            order = Orders.objects.create(
                ngo_id=ngo,
                inventory_id=inventory,
                quantity=qty,
                **validated_data
            )
        return order


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Orders
        fields = ("feedback_rating", "feedback_comment", "feedback_submitted_at")
        read_only_fields = ("feedback_submitted_at",)

    def validate_feedback_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

