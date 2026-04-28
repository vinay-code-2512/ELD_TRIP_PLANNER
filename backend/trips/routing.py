import requests

def get_route(pickup_coords, dropoff_coords):
    """
    Get real driving route using OSRM (Open Source Routing Machine).
    
    Args:
        pickup_coords: Dict with 'lat' and 'lng' for pickup
        dropoff_coords: Dict with 'lat' and 'lng' for dropoff
    
    Returns:
        Dict with 'distance_km', 'duration_hours', and 'polyline' (list of [lat, lng] coordinates).
        Falls back to straight-line distance on failure.
    """
    try:
        # OSRM expects longitude,latitude format
        pickup_lng = pickup_coords['lng']
        pickup_lat = pickup_coords['lat']
        dropoff_lng = dropoff_coords['lng']
        dropoff_lat = dropoff_coords['lat']
        
        # OSRM public demo server
        url = f"http://router.project-osrm.org/route/v1/driving/{pickup_lng},{pickup_lat};{dropoff_lng},{dropoff_lat}"
        params = {
            'overview': 'full',
            'geometries': 'geojson'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('code') == 'Ok' and data.get('routes'):
            route = data['routes'][0]
            distance_km = route['distance'] / 1000  # Convert meters to km
            duration_hours = route['duration'] / 3600  # Convert seconds to hours
            
            # Extract polyline coordinates
            polyline = []
            if 'geometry' in route and 'coordinates' in route['geometry']:
                # OSRM returns [lng, lat] pairs, convert to [lat, lng]
                polyline = [[coord[1], coord[0]] for coord in route['geometry']['coordinates']]
            
            return {
                'distance_km': round(distance_km, 2),
                'duration_hours': round(duration_hours, 2),
                'polyline': polyline
            }
    except requests.Timeout:
        print("Routing timeout - falling back to straight-line distance")
    except requests.ConnectionError:
        print("Routing connection error - falling back to straight-line distance")
    except Exception as e:
        print(f"Routing error: {e}")
    
    # Fall back to straight-line distance
    try:
        from .utils import calculate_distance_km
        distance = calculate_distance_km(pickup_coords, dropoff_coords)
        return {
            'distance_km': round(distance, 2),
            'duration_hours': round(distance / 60, 2),  # Assume 60 km/h
            'polyline': [
                [pickup_coords['lat'], pickup_coords['lng']],
                [dropoff_coords['lat'], dropoff_coords['lng']]
            ]
        }
    except Exception as e:
        print(f"Fallback distance calculation error: {e}")
        # Return a minimal valid response
        return {
            'distance_km': 0,
            'duration_hours': 0,
            'polyline': []
        }
