# accounts/serializers.py

from rest_framework import serializers
from .models import User,NGO


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = NGO
        fields = ["organization_name", "contact_number", "address"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    ngo = DriverSerializer(required=False)

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
    organization_name = serializers.CharField(source="ngo.organization_name", read_only=True)
    contact_number = serializers.CharField(
        source="ngo.contact_number", read_only=True
    )
    ngo_id = serializers.CharField(source="ngo.ngo_id", read_only=True)
    address = serializers.CharField(source="ngo.address", read_only=True)

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