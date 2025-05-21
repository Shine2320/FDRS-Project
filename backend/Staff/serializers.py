# accounts/serializers.py

from rest_framework import serializers
from .models import User, Staff


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ["name", "contact_number"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    staff = StaffSerializer(required=False)

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


class StaffUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="staff.name", read_only=True)
    contact_number = serializers.CharField(
        source="staff.contact_number", read_only=True
    )
    staff_id = serializers.CharField(source="staff.staff_id", read_only=True)

    class Meta:
        model = User
        fields = [
            "staff_id",
            "email",
            "role",
            "name",
            "contact_number",
            "is_active",
            "id",
        ]
