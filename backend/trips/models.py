from django.db import models
import json
from django.utils import timezone

class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField()
    distance_km = models.FloatField(null=True, blank=True)
    total_days = models.IntegerField(null=True, blank=True)
    trip_plan = models.TextField(null=True, blank=True)  # JSON string of the plan
    created_at = models.DateTimeField(default=timezone.now)
    
    # Store coordinates for map display
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)
    pickup_lat = models.FloatField(null=True, blank=True)
    pickup_lng = models.FloatField(null=True, blank=True)
    dropoff_lat = models.FloatField(null=True, blank=True)
    dropoff_lng = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.current_location} -> {self.dropoff_location}"

    def set_trip_plan(self, plan_dict):
        self.trip_plan = json.dumps(plan_dict)
        # Extract total_days from plan
        if plan_dict and 'days' in plan_dict:
            self.total_days = len(plan_dict['days'])

    def get_trip_plan(self):
        if self.trip_plan:
            return json.loads(self.trip_plan)
        return None
