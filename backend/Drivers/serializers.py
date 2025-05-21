# accounts/serializers.py

from rest_framework import serializers
from .models import User,Driver


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ["name", "contact_number", "vehicle"]


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
