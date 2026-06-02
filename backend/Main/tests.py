from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from Donors.models import Donor, Inventory
from Drivers.models import Driver, Deliveries
from Main.models import Notification, User
from NGO.models import NGO, Orders


class PracticalRequirementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="password",
            role=User.ADMIN,
            is_staff=True,
        )
        self.donor_user = User.objects.create_user(
            email="donor@example.com", password="password", role=User.DONOR
        )
        self.ngo_user = User.objects.create_user(
            email="ngo@example.com", password="password", role=User.NGO
        )
        self.driver_user = User.objects.create_user(
            email="driver@example.com", password="password", role=User.DRIVER
        )
        self.donor = Donor.objects.create(
            login_id=self.donor_user,
            name="Donor",
            contact_number="+911234567890",
            address="A",
        )
        self.ngo = NGO.objects.create(
            login_id=self.ngo_user,
            organization_name="NGO",
            contact_number="+911234567891",
            address="B",
        )
        self.driver = Driver.objects.create(
            login_id=self.driver_user,
            name="Driver",
            contact_number="+911234567892",
            vehicle="VH-1",
            address="C",
        )

    def make_inventory(self, quantity=5, status=Inventory.AVAILABLE):
        return Inventory.objects.create(
            donor_id=self.donor,
            food_type=Inventory.PACKED,
            item_name="Rice",
            quantity=quantity,
            expiration_date=timezone.localdate() + timedelta(days=1),
            status=status,
        )

    def test_inventory_rejects_invalid_quantity_and_past_expiration(self):
        self.client.force_authenticate(self.donor_user)
        response = self.client.post(
            "/donor/inventory/",
            {
                "food_type": Inventory.PACKED,
                "item_name": "Rice",
                "quantity": 0,
                "expiration_date": str(timezone.localdate() - timedelta(days=1)),
                "status": Inventory.AVAILABLE,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("quantity", response.data)
        self.assertIn("expiration_date", response.data)

    def test_order_quantity_validation_and_notification_creation(self):
        inventory = self.make_inventory(quantity=2)
        self.client.force_authenticate(self.ngo_user)
        response = self.client.post(
            "/ngo/orders/",
            {"inventory_id": inventory.inventory_id, "quantity": 3},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

        response = self.client.post(
            "/ngo/orders/",
            {"inventory_id": inventory.inventory_id, "quantity": 2},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        inventory.refresh_from_db()
        self.assertEqual(inventory.quantity, 0)
        self.assertEqual(inventory.status, Inventory.RESERVED)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.donor_user,
                event_type=Notification.ORDER_CREATED,
            ).exists()
        )

    def test_delivery_failure_restocks_and_soft_delete_filters_lists(self):
        inventory = self.make_inventory(quantity=5)
        order = Orders.objects.create(
            ngo_id=self.ngo,
            inventory_id=inventory,
            quantity=2,
            status=Orders.APPROVED,
        )
        inventory.quantity = 3
        inventory.save()
        Deliveries.objects.create(
            driver_id=self.driver,
            order_id=order,
            status=Deliveries.IN_TRANSIT,
        )

        self.client.force_authenticate(self.driver_user)
        response = self.client.patch(
            f"/driver/Delivery/{order.order_id}/",
            {"status": Deliveries.FAILED},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        inventory.refresh_from_db()
        self.assertEqual(order.status, Orders.FAILED)
        self.assertEqual(inventory.quantity, 5)
        self.assertEqual(inventory.status, Inventory.AVAILABLE)

        self.client.force_authenticate(self.admin)
        response = self.client.delete(f"/users/{self.donor_user.id}/")
        self.assertEqual(response.status_code, 204)
        response = self.client.get("/donor/list/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_feedback_after_delivery_only(self):
        inventory = self.make_inventory(quantity=5)
        order = Orders.objects.create(
            ngo_id=self.ngo,
            inventory_id=inventory,
            quantity=1,
            status=Orders.APPROVED,
        )
        self.client.force_authenticate(self.ngo_user)
        response = self.client.patch(
            f"/ngo/orders/{order.order_id}/feedback/",
            {"feedback_rating": 5, "feedback_comment": "Good"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

        order.status = Orders.DELIVERED
        order.save()
        response = self.client.patch(
            f"/ngo/orders/{order.order_id}/feedback/",
            {"feedback_rating": 5, "feedback_comment": "Good"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.feedback_rating, 5)

    def test_token_claims_fall_back_to_email_when_role_profile_is_missing(self):
        staff_user = User.objects.create_user(
            email="staff@example.com",
            password="password",
            role=User.STAFF,
        )

        response = self.client.post(
            "/auth/token/",
            {"email": staff_user.email, "password": "password"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        access = AccessToken(response.data["access"])
        self.assertEqual(access["role"], User.STAFF)
        self.assertEqual(access["name"], staff_user.email)
        self.assertEqual(access["email"], staff_user.email)

        response = self.client.post(
            "/auth/token/refresh/",
            {"refresh": response.data["refresh"]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        access = AccessToken(response.data["access"])
        self.assertEqual(access["role"], User.STAFF)
        self.assertEqual(access["name"], staff_user.email)
        self.assertEqual(access["email"], staff_user.email)
