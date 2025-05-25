# accounts/serializers.py

from rest_framework import serializers
from .models import User, Donor,Inventory


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
    name = serializers.CharField(source="donor.name")
    address = serializers.CharField(source="donor.address")
    contact_number = serializers.CharField(
        source="donor.contact_number"
    )
    donor_id = serializers.CharField(source="donor.donor_id", read_only=True)

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

    def update(self, instance, validated_data):
        # 1) Pop off nested donor data
        donor_data = validated_data.pop("donor", {})

        # 2) Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # 3) Update Donor fields
        donor = instance.donor
        for attr, value in donor_data.items():
            setattr(donor, attr, value)
        donor.save()

        return instance

class InventorySerializer(serializers.ModelSerializer):
    address = serializers.CharField(source="donor_id.address",read_only=True)
    contact_number = serializers.CharField(source="donor_id.contact_number",read_only=True)

    class Meta:
        model = Inventory
        fields = (
            'inventory_id',
            'food_type',
            'quantity',
            'expiration_date',
            'status',
            'item_name',
            'address',
            'contact_number'
        )
        read_only_fields = ('inventory_id','address','contact_number',)

    def create(self, validated_data):
        # grab the logged-in user’s donor record
        donor = self.context['request'].user.donor
        # create the Inventory row, wiring in donor_id automatically
        return Inventory.objects.create(donor_id=donor, **validated_data)
