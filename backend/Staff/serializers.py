# accounts/serializers.py

from rest_framework import serializers
from .models import User, Staff


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ["name", "contact_number","address"]


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
    name = serializers.CharField(source="staff.name", )
    contact_number = serializers.CharField(
        source="staff.contact_number",
    )
    staff_id = serializers.CharField(source="staff.staff_id", read_only=True)
    address = serializers.CharField(source="staff.address", )
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
            "address"
        ]

    def update(self, instance, validated_data):
        # 1) Pop off nested donor data
        staff_data = validated_data.pop("staff", {})

        # 2) Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 3) Update Donor fields
        staff = instance.staff
        for attr, value in staff_data.items():
            setattr(staff, attr, value)
        staff.save()

        return instance
