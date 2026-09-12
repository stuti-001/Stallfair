import re
from django.shortcuts import render
from .models import Event
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.contrib.sites.shortcuts import get_current_site
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import transaction



def home(request):
    return render(request, "index.html")


@user_passes_test(lambda u: u.is_active and (u.is_staff or u.is_superuser), login_url='admin_login')
def create_event(request):

    if request.method == "POST":

        Event.objects.create(
            title=request.POST["title"],
            location=request.POST["location"],
            date=request.POST["date"],
            description=request.POST["description"]
        )

        return redirect("event_list")

    return render(request, "event-management.html")


def event_list(request):
    event = Event.objects.all()

    return render(request, 'events.html',
                  {'events': event})



def event_detail(request, id):
    # Try to fetch the requested event; if it doesn't exist, render
    # the details page with a None event so the page still works.
    try:
        event_obj = Event.objects.get(id=id)
    except Event.DoesNotExist:
        event_obj = None

    return render(request, "event-details.html", {'event': event_obj})


@login_required(login_url='login')
def ticket_booking(request, id=None):
    event_obj = None
    if id:
        try:
            event_obj = Event.objects.get(id=id)
        except Event.DoesNotExist:
            event_obj = None
    if not event_obj:
        event_obj = Event.objects.first()

    return render(request, "ticketbooking.html", {'event': event_obj})


@login_required(login_url='login')
def my_tickets(request):
    events = Event.objects.all()
    return render(request, "myticket.html", {'events': events})


def handle_signup(request):
    fullname = request.POST.get("fullname", "").strip()
    email = request.POST.get("email", "").strip()
    password = request.POST.get("password", "")
    confirm_password = request.POST.get("confirm_password", "")

    if not fullname:
        return {"success": False, "error": "Please enter your full name."}

    if not email:
        return {"success": False, "error": "Please enter your email address."}

    # Validate email format
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email) or ".." in email or email.startswith(".") or email.endswith("."):
        return {"success": False, "error": "Invalid email address format (e.g. name@example.com)."}

    try:
        validate_email(email)
    except ValidationError:
        return {"success": False, "error": "Invalid email address format (e.g. name@example.com)."}

    # Prevent duplicate email/username
    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
        return {"success": False, "error": "An account with this email address already exists. Please log in."}

    if not password:
        return {"success": False, "error": "Please enter a password."}

    if not confirm_password:
        return {"success": False, "error": "Please confirm your password."}

    # Verify password and confirm password match
    if password != confirm_password:
        return {"success": False, "error": "Passwords do not match. Please ensure both passwords match."}

    # Validate password length
    if len(password) < 8:
        return {"success": False, "error": "Password must be at least 8 characters long."}

    # Validate password using Django's configured AUTH_PASSWORD_VALIDATORS
    try:
        validate_password(password)
    except ValidationError as e:
        return {"success": False, "error": " ".join(e.messages)}

    try:
        with transaction.atomic():
            # Split full name into first and last name
            name_parts = fullname.split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""

            # Create user using User.objects.create_user() as active user
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=True
            )

        return {"success": True, "message": "Account created successfully! You can now log in."}
    except Exception as e:
        return {"success": False, "error": f"Error creating account: {str(e)}"}


# view for verifying email
def verify_email(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        login(request, user)
        return render(request, "login.html", {"signup_success": "Email verified successfully! You are now logged in."})
    else:
        return render(request, "login.html", {"signup_error": "The verification link is invalid or has expired."})


# login view for the login page
def login_view(request):
    if request.user.is_authenticated and request.method == "GET":
        return redirect("home")

    if request.method == "POST":
        action = request.POST.get("action") or request.POST.get("form_action")

        if action == "signup":
            result = handle_signup(request)
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse(result)
            
            if result["success"]:
                return render(request, "login.html", {"signup_success": result["message"]})
            else:
                return render(request, "login.html", {"signup_error": result["error"]})

        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")

        if not username and not password:
            error_msg = "Please enter your email and password."
        elif not username:
            error_msg = "Please enter your email address."
        elif not password:
            error_msg = "Please enter your password."
        else:
            # Check if user exists in the database
            user_check = User.objects.filter(email__iexact=username).first() or User.objects.filter(username__iexact=username).first()

            if not user_check:
                error_msg = "No account found with this email address. Please check your email or sign up."
            elif not user_check.check_password(password):
                error_msg = "Incorrect password. Please verify your password and try again."
            elif not user_check.is_active:
                error_msg = "Please verify your email address before logging in."
            else:
                user = authenticate(
                    request,
                    username=user_check.username,
                    password=password
                )
                if user is not None:
                    login(request, user)
                    next_url = request.GET.get('next') or request.POST.get('next') or "/"
                    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                        return JsonResponse({"success": True, "redirect": next_url})
                    return redirect(next_url)
                else:
                    error_msg = "Unable to authenticate with the provided credentials."

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({"success": False, "error": error_msg})
        return render(request, "login.html", {
            "error": error_msg,
            "login_error": error_msg
        })

    return render(request, "login.html")


#login view for admin login page
def admin_login_view(request):

    if request.method == "POST":
        email_or_username = (request.POST.get("email") or request.POST.get("username") or "").strip()
        password = request.POST.get("password", "")

        if not email_or_username and not password:
            error_msg = "Please enter your work email and password."
        elif not email_or_username:
            error_msg = "Work email is required."
        elif not password:
            error_msg = "Password is required."
        else:
            user_obj = User.objects.filter(email__iexact=email_or_username).first() or User.objects.filter(username__iexact=email_or_username).first()

            if not user_obj:
                error_msg = "No staff account found with this email address."
            elif not user_obj.check_password(password):
                error_msg = "Incorrect password. Please verify your password and try again."
            elif not (user_obj.is_staff or user_obj.is_superuser):
                error_msg = "Access restricted: This account does not have staff or organizer permissions."
            elif not user_obj.is_active:
                error_msg = "Your staff account is inactive. Please contact the administrator."
            else:
                user = authenticate(
                    request,
                    username=user_obj.username,
                    password=password,
                )
                if user is not None and (user.is_staff or user.is_superuser):
                    login(request, user)
                    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                        return JsonResponse({"success": True, "redirect": "/event-management/"})
                    return redirect("create_event")
                else:
                    error_msg = "Unable to authenticate staff account."

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({"success": False, "error": error_msg})

        return render(request, "adminlogin.html", {
            "error": error_msg
        })

    return render(request, "adminlogin.html")


# view for user log out
def logout_view(request):
    logout(request)
    return redirect("home")


@login_required(login_url='login')
def organizer_dashboard(request):
    return render(request, "organizer-dashboard.html")

