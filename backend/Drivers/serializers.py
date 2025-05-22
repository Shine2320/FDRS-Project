# accounts/serializers.py

from rest_framework import serializers
from .models import User,Driver


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
    name = serializers.CharField(source="driver.name", read_only=True)
    vehicle = serializers.CharField(source="driver.vehicle", read_only=True)
    contact_number = serializers.CharField(
        source="driver.contact_number", read_only=True
    )
    driver_id = serializers.CharField(source="driver.driver_id", read_only=True)
    address = serializers.CharField(source="driver.address", read_only=True)
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