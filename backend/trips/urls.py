from django.urls import path
from .views import TripAPIView, LogPDFView, TripListView, RegisterView, LoginView

urlpatterns = [
    path('trip/', TripAPIView.as_view(), name='trip-create'),
    path('trips/', TripListView.as_view(), name='trip-list'),
    path('logs/pdf/', LogPDFView.as_view(), name='logs-pdf'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
]
