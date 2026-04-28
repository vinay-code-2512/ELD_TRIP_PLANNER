from rest_framework import serializers
from .models import Trip

class TripSerializer(serializers.ModelSerializer):
    trip_plan = serializers.JSONField(source='get_trip_plan', read_only=True)
    coordinates = serializers.SerializerMethodField()
    
    class Meta:
        model = Trip
        fields = ['id', 'current_location', 'pickup_location', 'dropoff_location', 
                  'current_cycle_used', 'distance_km', 'total_days', 'trip_plan', 
                  'created_at', 'coordinates']
        read_only_fields = ['trip_plan', 'total_days', 'created_at', 'coordinates']
    
    def get_coordinates(self, obj):
        return {
            'current': {'lat': obj.current_lat, 'lng': obj.current_lng} if obj.current_lat else None,
            'pickup': {'lat': obj.pickup_lat, 'lng': obj.pickup_lng} if obj.pickup_lat else None,
            'dropoff': {'lat': obj.dropoff_lat, 'lng': obj.dropoff_lng} if obj.dropoff_lat else None,
        }
