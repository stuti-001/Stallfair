"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from events import views

urlpatterns = [
    path("", views.home, name="home"),
    path("index/", views.home, name="index"),
    path('admin/', admin.site.urls),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("verify/<str:uidb64>/<str:token>/", views.verify_email, name="verify_email"),
    path("event-management/", views.create_event, name="create_event"),
    path("events/", views.event_list, name="event_list"),
    path("events/<int:id>/", views.event_detail, name="event_detail"),
    path("organizer-dashboard/", views.organizer_dashboard,
         name="organizer_dashboard"),
    path("adminlogin/", views.admin_login_view, name="admin_login"),
    path("ticketbooking/", views.ticket_booking, name="ticketbooking"),
    path("ticketbooking/<int:id>/", views.ticket_booking, name="ticketbooking_with_id"),
    path("ticket-booking/", views.ticket_booking, name="ticket_booking"),
    path("ticket-booking/<int:id>/", views.ticket_booking, name="ticket_booking_alias"),
    path("myticket/", views.my_tickets, name="my_tickets"),
    path("my-tickets/", views.my_tickets, name="my_tickets_alias"),
    path("mytickets/", views.my_tickets, name="mytickets_alias"),
]

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
