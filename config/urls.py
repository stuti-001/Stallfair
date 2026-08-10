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
from events import views

urlpatterns = [
    path("", views.home, name="home"),
    path('admin/', admin.site.urls),
    path("login/", views.login_view, name="login"),
    path("event-management/", views.create_event, name="create_event"),
    path("events/", views.event_list, name="event_list"),
    path("events/<int:id>/", views.event_detail, name="event_detail"),
    path("organizer-dashboard/", views.organizer_dashboard,
         name="organizer_dashboard"),
    path("adminlogin/", views.admin_login_view, name="admin_login"),
]
