# accounts/serializers.py

from rest_framework import serializers
from .models import User,Staff


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ["name", "contact_number"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    staff = DriverSerializer(required=False)

    class Meta:
        model = User
        fields = ["email", "password", "role", "staff"]

    def create(self, validated_data):
        staff_data = validated_data.pop("staff", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()        
        Staff.objects.create(login_id=user, **staff_data)

        return user
