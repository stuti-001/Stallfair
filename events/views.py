from django.shortcuts import render
from .models import Event
from django.shortcuts import redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User



def home(request):
    return render(request, "index.html")


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


# login view for the login page
def login_view(request):

    if request.method == "POST":

        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            login(request, user)
            return redirect("organizer_dashboard")

        else:
            return render(request, "login.html", {
                "error": "Invalid username or password."
            })
    return render(request, "login.html")


#login view for admin login page
def admin_login_view(request):

    if request.method == "POST":

        email_or_username = request.POST.get("email") or request.POST.get("username")
        password = request.POST.get("password", "")

        user_obj = None
        if email_or_username:
            try:
                user_obj = User.objects.get(email=email_or_username)
            except User.DoesNotExist:
                try:
                    user_obj = User.objects.get(username=email_or_username)
                except User.DoesNotExist:
                    user_obj = None

        if user_obj:
            user = authenticate(
                request,
                username=user_obj.username,
                password=password,
            )
        else:
            user = None

        if user is not None and (user.is_staff or user.is_superuser):
            login(request, user)
            return redirect("create_event")

        return render(request, "adminlogin.html", {
            "error": "Invalid email or password."
        })

    return render(request, "adminlogin.html")




def organizer_dashboard(request):
    return render(request, "organizer-dashboard.html")

