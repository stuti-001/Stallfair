from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes


class AdminLoginTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff_user = User.objects.create_user(
            username="owner@stallfair.biz",
            email="owner@stallfair.biz",
            password="testpass123",
            is_staff=True,
        )
        self.regular_user = User.objects.create_user(
            username="customer@stallfair.biz",
            email="customer@stallfair.biz",
            password="testpass123",
            is_staff=False,
        )

    def test_admin_login_redirects_to_event_management(self):
        response = self.client.post(
            reverse("admin_login"),
            {"email": self.staff_user.email, "password": "testpass123"},
        )
        self.assertRedirects(response, reverse("create_event"))

    def test_admin_login_nonexistent_user(self):
        response = self.client.post(
            reverse("admin_login"),
            {"email": "unknown@stallfair.biz", "password": "testpass123"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "No staff account found with this email address.")

    def test_admin_login_wrong_password(self):
        response = self.client.post(
            reverse("admin_login"),
            {"email": self.staff_user.email, "password": "wrongpassword"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Incorrect password. Please verify your password and try again.")

    def test_admin_login_non_staff_forbidden(self):
        response = self.client.post(
            reverse("admin_login"),
            {"email": self.regular_user.email, "password": "testpass123"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Access restricted: This account does not have staff or organizer permissions.")


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.signup_url = reverse("login")
        self.login_url = reverse("login")

    def test_customer_signup_and_login_flow(self):
        # Test 1: Create a new account with valid information
        signup_response = self.client.post(
            self.signup_url,
            {
                "action": "signup",
                "fullname": "Stuti Poudel",
                "email": "stuti.test@stallfair.com",
                "password": "Password123!",
                "confirm_password": "Password123!",
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = signup_response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["message"], "Account created successfully! You can now log in.")
        
        # User should exist in DB and be active
        user = User.objects.get(email="stuti.test@stallfair.com")
        self.assertTrue(user.is_active)
        self.assertEqual(user.first_name, "Stuti")
        self.assertEqual(user.last_name, "Poudel")

        # Test 2: Try logging in using that newly created account
        login_response = self.client.post(
            self.login_url,
            {
                "action": "login",
                "username": "stuti.test@stallfair.com",
                "password": "Password123!"
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        login_data = login_response.json()
        self.assertTrue(login_data["success"])
        self.assertEqual(login_data["redirect"], "/")

        # Verify home page renders index.html
        home_response = self.client.get(reverse("home"))
        self.assertEqual(home_response.status_code, 200)
        self.assertTemplateUsed(home_response, "index.html")

        # Test 3: Standard form post login redirects to home
        standard_login_response = self.client.post(
            self.login_url,
            {
                "action": "login",
                "username": "stuti.test@stallfair.com",
                "password": "Password123!"
            }
        )
        self.assertRedirects(standard_login_response, reverse("home"))

        # Test 4: Log out and verify the protected pages can no longer be accessed
        logout_response = self.client.get(reverse("logout"))
        self.assertRedirects(logout_response, reverse("home"))
        protected_response = self.client.get(reverse("organizer_dashboard"))
        self.assertRedirects(protected_response, f"{reverse('login')}?next={reverse('organizer_dashboard')}")

    def test_signup_missing_fullname(self):
        response = self.client.post(
            self.signup_url,
            {
                "action": "signup",
                "fullname": "",
                "email": "test@stallfair.com",
                "password": "Password123!",
                "confirm_password": "Password123!",
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Please enter your full name.")

    def test_signup_invalid_email_format(self):
        invalid_emails = [
            "not-an-email",
            "user@",
            "@example.com",
            "user@domain",
            "user@domain..com",
            "user..name@example.com",
            ".user@example.com",
            "user@example.com.",
            "user@domain.c",
            "user name@example.com",
        ]
        for invalid_email in invalid_emails:
            response = self.client.post(
                self.signup_url,
                {
                    "action": "signup",
                    "fullname": "Test User",
                    "email": invalid_email,
                    "password": "Password123!",
                    "confirm_password": "Password123!",
                },
                HTTP_X_REQUESTED_WITH="XMLHttpRequest"
            )
            data = response.json()
            self.assertFalse(data["success"], f"Expected failure for email: {invalid_email}")
            self.assertEqual(data["error"], "Invalid email address format (e.g. name@example.com).")

    def test_signup_duplicate_email(self):
        User.objects.create_user(
            username="existing@stallfair.com",
            email="existing@stallfair.com",
            password="Password123!"
        )
        response = self.client.post(
            self.signup_url,
            {
                "action": "signup",
                "fullname": "Another User",
                "email": "existing@stallfair.com",
                "password": "Password123!",
                "confirm_password": "Password123!",
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "An account with this email address already exists. Please log in.")

    def test_signup_mismatched_passwords(self):
        response = self.client.post(
            self.signup_url,
            {
                "action": "signup",
                "fullname": "Test User",
                "email": "test@stallfair.com",
                "password": "Password123!",
                "confirm_password": "DifferentPassword123!",
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Passwords do not match. Please ensure both passwords match.")

    def test_signup_fails_weak_password(self):
        # Password too short
        response = self.client.post(
            self.signup_url,
            {
                "action": "signup",
                "fullname": "Test User",
                "email": "test@stallfair.com",
                "password": "123",
                "confirm_password": "123",
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("Password must be at least 8 characters long.", data["error"])

    def test_login_nonexistent_email(self):
        response = self.client.post(
            self.login_url,
            {
                "action": "login",
                "username": "nosuchuser@stallfair.com",
                "password": "Password123!"
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "No account found with this email address. Please check your email or sign up.")

    def test_login_wrong_password(self):
        User.objects.create_user(
            username="valid@stallfair.com",
            email="valid@stallfair.com",
            password="Password123!",
            is_active=True
        )
        response = self.client.post(
            self.login_url,
            {
                "action": "login",
                "username": "valid@stallfair.com",
                "password": "WrongPassword!"
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Incorrect password. Please verify your password and try again.")

    def test_inactive_user_cannot_login(self):
        # Create an inactive user manually
        User.objects.create_user(
            username="inactive@stallfair.com",
            email="inactive@stallfair.com",
            password="Password123!",
            is_active=False
        )

        response = self.client.post(
            self.login_url,
            {
                "action": "login",
                "username": "inactive@stallfair.com",
                "password": "Password123!"
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Please verify your email address before logging in.")

    def test_email_verification_activates_user(self):
        user = User.objects.create_user(
            username="verify@stallfair.com",
            email="verify@stallfair.com",
            password="Password123!",
            is_active=False
        )
        
        # Generate token
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        verify_url = reverse("verify_email", kwargs={"uidb64": uidb64, "token": token})
        response = self.client.get(verify_url)
        
        # User should be active now
        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertContains(response, "Email verified successfully")

    def test_page_restrictions(self):
        # Anonymous users should not be allowed on dashboard
        response = self.client.get(reverse("organizer_dashboard"))
        self.assertRedirects(response, f"{reverse('login')}?next={reverse('organizer_dashboard')}")

        # Anonymous users should be redirected to admin_login for create_event page
        response = self.client.get(reverse("create_event"))
        self.assertRedirects(response, f"{reverse('admin_login')}?next={reverse('create_event')}")

    def test_navbar_login_logout_toggle(self):
        # 1. Unauthenticated user sees "Log in" and NOT "Log out"
        home_resp = self.client.get(reverse("home"))
        self.assertContains(home_resp, "Log in")
        self.assertNotContains(home_resp, "Log out")

        events_resp = self.client.get(reverse("event_list"))
        self.assertContains(events_resp, "Log in")
        self.assertNotContains(events_resp, "Log out")

        # 2. Create and log in user
        user = User.objects.create_user(
            username="navbar_test@stallfair.com",
            email="navbar_test@stallfair.com",
            password="Password123!"
        )
        self.client.force_login(user)

        # 3. Authenticated user sees "Log out" and NOT "Log in"
        home_resp_auth = self.client.get(reverse("home"))
        self.assertContains(home_resp_auth, "Log out")
        self.assertNotContains(home_resp_auth, ">Log in<")

        events_resp_auth = self.client.get(reverse("event_list"))
        self.assertContains(events_resp_auth, "Log out")
        self.assertNotContains(events_resp_auth, ">Log in<")

    def test_my_tickets_view(self):
        # 1. Unauthenticated access redirects to login
        unauth_response = self.client.get(reverse("my_tickets"))
        self.assertRedirects(unauth_response, f"{reverse('login')}?next={reverse('my_tickets')}")

        # 2. Authenticated access renders myticket.html
        user = User.objects.create_user(
            username="wallet_user@stallfair.com",
            email="wallet_user@stallfair.com",
            password="Password123!"
        )
        self.client.force_login(user)
        response = self.client.get(reverse("my_tickets"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "myticket.html")
        self.assertContains(response, "Your ticket wallet")
        self.assertContains(response, "Sunrise Farmers Market")
        self.assertContains(response, "Vintage Vinyl Swap")

    def test_login_page_only_for_logged_out_users(self):
        # 1. Logged out user can access login page
        response = self.client.get(reverse("login"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "login.html")

        # 2. Logged in user gets redirected to home
        user = User.objects.create_user(
            username="logged_in_user@stallfair.com",
            email="logged_in_user@stallfair.com",
            password="Password123!"
        )
        self.client.force_login(user)
        auth_response = self.client.get(reverse("login"))
        self.assertRedirects(auth_response, reverse("home"))

    def test_ticket_booking_requires_login(self):
        # 1. Unauthenticated access to ticket booking redirects to login
        unauth_response = self.client.get(reverse("ticketbooking"))
        self.assertRedirects(unauth_response, f"{reverse('login')}?next={reverse('ticketbooking')}")

        unauth_response_id = self.client.get(reverse("ticketbooking_with_id", kwargs={"id": 1}))
        self.assertRedirects(unauth_response_id, f"{reverse('login')}?next={reverse('ticketbooking_with_id', kwargs={'id': 1})}")

        # 2. Authenticated access to ticket booking renders ticketbooking.html
        user = User.objects.create_user(
            username="booking_user@stallfair.com",
            email="booking_user@stallfair.com",
            password="Password123!"
        )
        self.client.force_login(user)
        auth_response = self.client.get(reverse("ticketbooking"))
        self.assertEqual(auth_response.status_code, 200)
        self.assertTemplateUsed(auth_response, "ticketbooking.html")
        self.assertContains(auth_response, "Choose your tickets")





