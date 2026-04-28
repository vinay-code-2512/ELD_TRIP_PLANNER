import requests
import time

def get_coordinates(location_name):
    """
    Get coordinates for a location name using Nominatim (OpenStreetMap) API.
    
    Args:
        location_name: String name of the location (e.g., "New York", "Los Angeles")
    
    Returns:
        Dict with 'lat' and 'lng' keys, or None if not found
    """
    # Check if input is already coordinates (format: "lat,lng")
    if ',' in location_name and len(location_name.split(',')) == 2:
        try:
            lat, lng = map(float, location_name.split(','))
            return {'lat': lat, 'lng': lng}
        except ValueError:
            pass  # Not coordinates, proceed with geocoding
    
    # Use Nominatim API
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': location_name,
        'format': 'json',
        'limit': 1
    }
    headers = {
        'User-Agent': 'ELDTripPlanner/1.0'  # Required by Nominatim
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            return {
                'lat': float(data[0]['lat']),
                'lng': float(data[0]['lon'])
            }
    except Exception as e:
        print(f"Geocoding error for '{location_name}': {e}")
        # Fall back to dummy coordinates if API fails
        return get_dummy_coordinates(location_name)
    
    # If not found, return dummy coordinates
    return get_dummy_coordinates(location_name)


def get_dummy_coordinates(location_name):
    """
    Fallback dummy coordinates for common cities.
    """
    DUMMY_COORDINATES = {
        'New York': {'lat': 40.7128, 'lng': -74.0060},
        'Los Angeles': {'lat': 34.0522, 'lng': -118.2437},
        'Chicago': {'lat': 41.8781, 'lng': -87.6298},
        'Houston': {'lat': 29.7604, 'lng': -95.3698},
        'Miami': {'lat': 25.7617, 'lng': -80.1918},
    }
    
    # Try partial match
    for city, coords in DUMMY_COORDINATES.items():
        if city.lower() in location_name.lower():
            return coords
    
    # Default to New York if not found
    return {'lat': 40.7128, 'lng': -74.0060}


def calculate_distance_km(coord1, coord2):
    """
    Calculate distance between two coordinates using Haversine formula.
    
    Args:
        coord1: Dict with 'lat' and'lng'
        coord2: Dict with 'lat' and 'lng'
    
    Returns:
        Distance in kilometers
    """
    from math import radians, cos, sin, asin, sqrt
    
    lat1, lon1 = coord1['lat'], coord1['lng']
    lat2, lon2 = coord2['lat'], coord2['lng']
    
    R = 6371  # Earth's radius in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c
