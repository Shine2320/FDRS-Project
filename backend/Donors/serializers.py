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

        # If role is DONOR, create a Donor profile
        if user.role == User.DONOR and donor_data:
            Donor.objects.create(login_id=user, **donor_data)

        return user
