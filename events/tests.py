from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse


class AdminLoginTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff_user = User.objects.create_user(
            username="owner@stallfair.biz",
            email="owner@stallfair.biz",
            password="testpass123",
            is_staff=True,
        )

    def test_admin_login_redirects_to_event_management(self):
        response = self.client.post(
            reverse("admin_login"),
            {"email": self.staff_user.email, "password": "testpass123"},
        )
        self.assertRedirects(response, reverse("create_event"))

