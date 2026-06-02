from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from Donors.models import Donor, Inventory
from Drivers.models import Driver, Deliveries
from Main.models import Notification, User
from NGO.models import NGO, Orders
from Staff.models import Staff


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
        self.staff_user = User.objects.create_user(
            email="staff@example.com", password="password", role=User.STAFF
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
        self.assertFalse(
            Notification.objects.filter(
                event_type=Notification.DONATION_AVAILABLE
            ).exists()
        )

    def test_inventory_creation_notifies_ngos_staff_and_admins(self):
        inactive_ngo_user = User.objects.create_user(
            email="inactive-ngo@example.com",
            password="password",
            role=User.NGO,
            is_active=False,
        )
        NGO.objects.create(
            login_id=inactive_ngo_user,
            organization_name="Inactive NGO",
            contact_number="+911234567893",
            address="D",
        )

        self.client.force_authenticate(self.donor_user)
        response = self.client.post(
            "/donor/inventory/",
            {
                "food_type": Inventory.PACKED,
                "item_name": "Vegetables",
                "quantity": 4,
                "expiration_date": str(timezone.localdate() + timedelta(days=1)),
                "status": Inventory.AVAILABLE,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        recipients = set(
            Notification.objects.filter(
                event_type=Notification.DONATION_AVAILABLE
            ).values_list("recipient__email", flat=True)
        )
        self.assertEqual(
            recipients,
            {
                self.ngo_user.email,
                self.staff_user.email,
                self.admin.email,
            },
        )
        self.assertFalse(
            Notification.objects.filter(
                recipient=inactive_ngo_user,
                event_type=Notification.DONATION_AVAILABLE,
            ).exists()
        )

    def test_staff_profile_creates_missing_staff_record_with_staff_id(self):
        self.assertFalse(Staff.objects.filter(login_id=self.staff_user).exists())

        self.client.force_authenticate(self.staff_user)
        response = self.client.get("/staff/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertIsNotNone(response.data[0]["staff_id"])
        self.assertTrue(Staff.objects.filter(login_id=self.staff_user).exists())

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
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.staff_user,
                event_type=Notification.ORDER_CREATED,
            ).exists()
        )

        self.client.force_authenticate(self.staff_user)
        response = self.client.get("/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            any(
                item["event_type"] == Notification.ORDER_CREATED
                for item in response.data
            )
        )

    def test_order_creation_rejects_ngo_user_without_profile(self):
        inventory = self.make_inventory(quantity=2)
        orphan_ngo_user = User.objects.create_user(
            email="orphan-ngo@example.com",
            password="password",
            role=User.NGO,
        )

        self.client.force_authenticate(orphan_ngo_user)
        response = self.client.post(
            "/ngo/orders/",
            {"inventory_id": inventory.inventory_id, "quantity": 1},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("ngo", response.data)
        self.assertFalse(Orders.objects.filter(inventory_id=inventory).exists())
        inventory.refresh_from_db()
        self.assertEqual(inventory.quantity, 2)
        self.assertEqual(inventory.status, Inventory.AVAILABLE)

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
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.staff_user,
                event_type=Notification.DELIVERY_FAILED,
            ).exists()
        )

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
            email="token-staff@example.com",
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

    def test_password_reset_updates_password_for_registered_user(self):
        response = self.client.post(
            "/auth/password-reset/",
            {
                "email": self.donor_user.email,
                "new_password": "NewPassword123",
                "confirm_password": "NewPassword123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.donor_user.refresh_from_db()
        self.assertTrue(self.donor_user.check_password("NewPassword123"))

        response = self.client.post(
            "/auth/token/",
            {"email": self.donor_user.email, "password": "NewPassword123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_password_reset_rejects_mismatched_passwords(self):
        response = self.client.post(
            "/auth/password-reset/",
            {
                "email": self.donor_user.email,
                "new_password": "NewPassword123",
                "confirm_password": "OtherPassword123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("confirm_password", response.data)
