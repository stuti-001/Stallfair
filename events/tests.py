from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from events.models import Event


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

    def test_admin_direct_login_creates_account_automatically(self):
        # Admin can directly log in without creating an account first
        response = self.client.post(
            reverse("admin_login"),
            {"email": "neworganizer@stallfair.biz", "password": "securepassword123"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["redirect"], "/event-management/")

        # Check that user exists and has staff/superuser status
        new_user = User.objects.get(email="neworganizer@stallfair.biz")
        self.assertTrue(new_user.is_staff)
        self.assertTrue(new_user.is_superuser)
        self.assertTrue(new_user.is_active)

    def test_admin_direct_login_grants_organizer_access(self):
        # Logging in via admin login grants staff/superuser permissions directly
        response = self.client.post(
            reverse("admin_login"),
            {"email": self.regular_user.email, "password": "testpass123"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertTrue(data["success"])

        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.is_staff)
        self.assertTrue(self.regular_user.is_superuser)


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
        self.assertRedirects(protected_response, f"{reverse('admin_login')}?next={reverse('organizer_dashboard')}")

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

    def test_signup_allows_common_password(self):
        response = self.client.post(
            self.signup_url,
            {
                "action": "signup",
                "fullname": "Common User",
                "email": "commonpass@stallfair.com",
                "password": "password123",
                "confirm_password": "password123",
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["message"], "Account created successfully! You can now log in.")


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
        self.assertRedirects(response, f"{reverse('admin_login')}?next={reverse('organizer_dashboard')}")

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

        # 2. Create and log in customer user
        user = User.objects.create_user(
            username="navbar_test@stallfair.com",
            email="navbar_test@stallfair.com",
            password="Password123!"
        )
        self.client.force_login(user)
        session = self.client.session
        session['auth_role'] = 'customer'
        session.save()

        # 3. Authenticated customer sees "Log out" and NOT "Log in"
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
        session = self.client.session
        session['auth_role'] = 'customer'
        session.save()
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

        # 2. Logged in customer user gets redirected to home
        user = User.objects.create_user(
            username="logged_in_user@stallfair.com",
            email="logged_in_user@stallfair.com",
            password="Password123!"
        )
        self.client.force_login(user)
        session = self.client.session
        session['auth_role'] = 'customer'
        session.save()
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
        session = self.client.session
        session['auth_role'] = 'customer'
        session.save()
        auth_response = self.client.get(reverse("ticketbooking"))
        self.assertEqual(auth_response.status_code, 200)
        self.assertTemplateUsed(auth_response, "ticketbooking.html")
        self.assertContains(auth_response, "Choose your tickets")

    def test_user_profile_requires_login(self):
        # 1. Unauthenticated access to user profile redirects to login
        unauth_response = self.client.get(reverse("user_profile"))
        self.assertRedirects(unauth_response, f"{reverse('login')}?next={reverse('user_profile')}")

        unauth_alias = self.client.get(reverse("profile"))
        self.assertRedirects(unauth_alias, f"{reverse('login')}?next={reverse('profile')}")

    def test_user_profile_authenticated_and_update(self):
        # 1. Create and log in customer user
        user = User.objects.create_user(
            username="profileuser@stallfair.com",
            email="profileuser@stallfair.com",
            password="Password123!",
            first_name="Stuti",
            last_name="Sharma"
        )
        self.client.force_login(user)
        session = self.client.session
        session['auth_role'] = 'customer'
        session.save()

        # 2. Authenticated customer can view their profile
        response = self.client.get(reverse("user_profile"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "userprofile.html")
        self.assertContains(response, "Stuti Sharma")
        self.assertContains(response, "profileuser@stallfair.com")
        self.assertContains(response, "Save changes")
        # Ensure removed items from prompt are NOT present
        self.assertNotContains(response, ">Details<")
        self.assertNotContains(response, "Saved Events")
        self.assertNotContains(response, "Order History")
        self.assertNotContains(response, "Collector badge")

        # 3. User can update profile via AJAX
        update_response = self.client.post(
            reverse("user_profile"),
            {
                "fullname": "Stuti Newname",
                "email": "updated_email@stallfair.com",
                "phone": "+977 9800000000",
                "city": "Pokhara"
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        data = update_response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["message"], "Profile updated successfully!")

        user.refresh_from_db()
        self.assertEqual(user.first_name, "Stuti")
        self.assertEqual(user.last_name, "Newname")
        self.assertEqual(user.email, "updated_email@stallfair.com")

    def test_specific_event_details_rendering(self):
        # 1. Test Event 1 details
        resp1 = self.client.get(reverse("event_detail", kwargs={"id": 1}))
        self.assertEqual(resp1.status_code, 200)
        self.assertContains(resp1, "Sunrise Farmers Market")
        self.assertContains(resp1, "Food &amp; Produce")
        self.assertContains(resp1, "Riverside Green")

        # 2. Test Event 2 details
        resp2 = self.client.get(reverse("event_detail", kwargs={"id": 2}))
        self.assertEqual(resp2.status_code, 200)
        self.assertContains(resp2, "Vintage Vinyl Swap")
        self.assertContains(resp2, "Vintage &amp; Music")
        self.assertContains(resp2, "The Old Depot")

        # 3. Test Event 3 details
        resp3 = self.client.get(reverse("event_detail", kwargs={"id": 3}))
        self.assertEqual(resp3.status_code, 200)
        self.assertContains(resp3, "Night Noodle Bazaar")
        self.assertContains(resp3, "Street Food")
        self.assertContains(resp3, "Pier 9")

        # 4. Test Event 4 details
        resp4 = self.client.get(reverse("event_detail", kwargs={"id": 4}))
        self.assertEqual(resp4.status_code, 200)
        self.assertContains(resp4, "Handmade Paper &amp; Craft Fair")
        self.assertContains(resp4, "Craft")
        self.assertContains(resp4, "Baghbazar Courtyard")


class EventCreationFlowTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_user(
            username="organizer@stallfair.com",
            email="organizer@stallfair.com",
            password="OrganizerPass123!",
            is_staff=True,
            is_superuser=True,
            is_active=True
        )

    def test_create_event_saves_all_fields_to_database(self):
        self.client.force_login(self.admin_user)
        session = self.client.session
        session['auth_role'] = 'admin'
        session.save()

        response = self.client.post(
            reverse("create_event"),
            {
                "title": "Pokhara Vinyl and Acoustic Festival",
                "venue": "Phewa Lakeside Amphitheater",
                "date": "Sat, 20 Dec",
                "time": "1:00-7:00pm",
                "category": "Music & Vinyl",
                "description": "Indie acoustic artists and rare vinyl records by the lake.",
            },
            HTTP_X_REQUESTED_WITH="XMLHttpRequest"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("Pokhara Vinyl and Acoustic Festival", data["message"])

        # Verify record exists in Event model/table
        event = Event.objects.filter(title="Pokhara Vinyl and Acoustic Festival").first()
        self.assertIsNotNone(event)
        self.assertEqual(event.location, "Phewa Lakeside Amphitheater")
        self.assertEqual(event.category, "Music & Vinyl")
        self.assertEqual(event.description, "Indie acoustic artists and rare vinyl records by the lake.")
        self.assertEqual(event.time.hour, 13)

        # Verify event appears in user event listing
        listing_resp = self.client.get(reverse("event_list"))
        self.assertEqual(listing_resp.status_code, 200)
        self.assertContains(listing_resp, "Pokhara Vinyl and Acoustic Festival")
        self.assertContains(listing_resp, "Phewa Lakeside Amphitheater")

        # Verify event detail page works
        detail_resp = self.client.get(reverse("event_detail", kwargs={"id": event.id}))
        self.assertEqual(detail_resp.status_code, 200)
        self.assertContains(detail_resp, "Pokhara Vinyl and Acoustic Festival")


class SessionSeparationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_user(
            username="admin@stallfair.com",
            email="admin@stallfair.com",
            password="AdminPassword123!",
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        self.customer_user = User.objects.create_user(
            username="customer@stallfair.com",
            email="customer@stallfair.com",
            password="CustomerPassword123!",
            is_staff=False,
            is_active=True
        )

    def test_admin_login_cannot_access_customer_pages(self):
        # Log in via Admin login
        login_resp = self.client.post(
            reverse("admin_login"),
            {"email": self.admin_user.email, "password": "AdminPassword123!"}
        )
        self.assertRedirects(login_resp, reverse("create_event"))

        # Admin session must NOT access customer profile
        profile_resp = self.client.get(reverse("user_profile"))
        self.assertRedirects(profile_resp, f"{reverse('login')}?next={reverse('user_profile')}")

        # Admin session must NOT access customer ticket booking
        booking_resp = self.client.get(reverse("ticketbooking"))
        self.assertRedirects(booking_resp, f"{reverse('login')}?next={reverse('ticketbooking')}")

        # Admin session must NOT access customer ticket wallet
        tickets_resp = self.client.get(reverse("my_tickets"))
        self.assertRedirects(tickets_resp, f"{reverse('login')}?next={reverse('my_tickets')}")

    def test_admin_session_navbar_shows_logged_out_on_customer_side(self):
        # Log in via Admin login
        self.client.post(
            reverse("admin_login"),
            {"email": self.admin_user.email, "password": "AdminPassword123!"}
        )

        # On public customer pages, admin is NOT treated as an authenticated customer
        home_resp = self.client.get(reverse("home"))
        self.assertContains(home_resp, "Log in")
        self.assertNotContains(home_resp, "Log out")

        events_resp = self.client.get(reverse("event_list"))
        self.assertContains(events_resp, "Log in")
        self.assertNotContains(events_resp, "Log out")

    def test_customer_login_cannot_access_organizer_pages(self):
        # Log in via Customer login
        login_resp = self.client.post(
            reverse("login"),
            {"username": self.customer_user.email, "password": "CustomerPassword123!"}
        )
        self.assertRedirects(login_resp, "/")

        # Customer session must NOT access Manage Events (create_event)
        manage_resp = self.client.get(reverse("create_event"))
        self.assertRedirects(manage_resp, f"{reverse('admin_login')}?next={reverse('create_event')}")

        # Customer session must NOT access Organizer Dashboard
        dashboard_resp = self.client.get(reverse("organizer_dashboard"))
        self.assertRedirects(dashboard_resp, f"{reverse('admin_login')}?next={reverse('organizer_dashboard')}")

    def test_customer_session_navbar_shows_logged_in_on_customer_side(self):
        # Log in via Customer login
        self.client.post(
            reverse("login"),
            {"username": self.customer_user.email, "password": "CustomerPassword123!"}
        )

        home_resp = self.client.get(reverse("home"))
        self.assertContains(home_resp, "Log out")
        self.assertNotContains(home_resp, ">Log in<")

    def test_logout_completely_terminates_session(self):
        # Log in as Admin
        self.client.post(
            reverse("admin_login"),
            {"email": self.admin_user.email, "password": "AdminPassword123!"}
        )
        # Log out
        logout_resp = self.client.get(reverse("logout"))
        self.assertRedirects(logout_resp, reverse("home"))

        # Both admin and customer restricted pages must now be blocked
        admin_page_resp = self.client.get(reverse("create_event"))
        self.assertRedirects(admin_page_resp, f"{reverse('admin_login')}?next={reverse('create_event')}")

        customer_page_resp = self.client.get(reverse("user_profile"))
        self.assertRedirects(customer_page_resp, f"{reverse('login')}?next={reverse('user_profile')}")

    def test_switching_accounts_requires_separate_login(self):
        # 1. Log in as Admin
        self.client.post(
            reverse("admin_login"),
            {"email": self.admin_user.email, "password": "AdminPassword123!"}
        )
        # Can access admin page
        self.assertEqual(self.client.get(reverse("create_event")).status_code, 200)

        # 2. Log out
        self.client.get(reverse("logout"))

        # 3. Log in as Customer
        self.client.post(
            reverse("login"),
            {"username": self.customer_user.email, "password": "CustomerPassword123!"}
        )
        # Can access customer profile
        self.assertEqual(self.client.get(reverse("user_profile")).status_code, 200)
        # Cannot access admin page
        self.assertRedirects(self.client.get(reverse("create_event")), f"{reverse('admin_login')}?next={reverse('create_event')}")








