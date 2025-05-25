# accounts/serializers.py

from rest_framework import serializers

from NGO.models import Orders
from .models import User, Driver, Deliveries


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ["name", "contact_number", "vehicle","address"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    driver = DriverSerializer(required=False)

    class Meta:
        model = User
        fields = ["email", "password", "role", "driver"]

    def create(self, validated_data):
        driver_data = validated_data.pop("driver", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        Driver.objects.create(login_id=user, **driver_data)

        return user

class DriverUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="driver.name",)
    vehicle = serializers.CharField(source="driver.vehicle", )
    contact_number = serializers.CharField(
        source="driver.contact_number",
    )
    driver_id = serializers.CharField(source="driver.driver_id", read_only=True)
    address = serializers.CharField(source="driver.address", )
    class Meta:
        model = User
        fields = [
            "driver_id",
            "email",
            "role",
            "name",
            "contact_number",
            "is_active",
            "id",
            "vehicle",
            "address"
        ]
    def update(self, instance, validated_data):
        # 1) Pop off nested donor data
        driver_data = validated_data.pop("driver", {})

        # 2) Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 3) Update Donor fields
        driver = instance.driver
        for attr, value in driver_data.items():
            setattr(driver, attr, value)
        driver.save()

        return instance

class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliveries
        fields = '__all__'




