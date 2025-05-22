# accounts/serializers.py

from rest_framework import serializers
from .models import User, Donor


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
    name = serializers.CharField(source="donor.name", read_only=True)
    address = serializers.CharField(source="donor.address", read_only=True)
    contact_number = serializers.CharField(
        source="donor.contact_number", read_only=True
    )
    donor_id = serializers.CharField(source="staff.donor_id", read_only=True)

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