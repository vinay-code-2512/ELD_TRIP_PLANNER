from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .serializers import TripSerializer
from .models import Trip
from .utils import calculate_trip_plan, generate_log_sheet, validate_trip_plan
from .geocoding import get_coordinates
from .routing import get_route
from .pdf_generator import generate_log_sheet_pdf
from django.http import FileResponse

class TripAPIView(APIView):
    def post(self, request):
        serializer = TripSerializer(data=request.data)
        if serializer.is_valid():
            # Get location names
            current_loc = request.data.get('current_location', '')
            pickup_loc = request.data.get('pickup_location', '')
            dropoff_loc = request.data.get('dropoff_location', '')

            # Validate locations are not empty
            if not current_loc or not pickup_loc or not dropoff_loc:
                return Response({'error': 'All location fields are required'}, status=status.HTTP_400_BAD_REQUEST)

            # Get coordinates using geocoding
            try:
                current_coords = get_coordinates(current_loc)
                pickup_coords = get_coordinates(pickup_loc)
                dropoff_coords = get_coordinates(dropoff_loc)
            except Exception as e:
                print(f"Geocoding error: {e}")
                return Response({'error': 'Failed to find one or more locations. Please check the location names.'}, status=status.HTTP_400_BAD_REQUEST)

            # Check if coordinates were found
            if not current_coords or not pickup_coords or not dropoff_coords:
                return Response({'error': 'Unable to find coordinates for one or more locations. Please enter valid city names.'}, status=status.HTTP_400_BAD_REQUEST)

            # Get real route using OSRM
            try:
                route_data = get_route(pickup_coords, dropoff_coords)
            except Exception as e:
                print(f"Routing error: {e}")
                # Fallback to straight-line distance
                route_data = None
            
            if route_data:
                distance_km = route_data['distance_km']
                duration_hours = route_data['duration_hours']
                polyline = route_data['polyline']
            else:
                # Fallback to straight-line distance
                from .utils import calculate_distance_km
                distance_km = calculate_distance_km(pickup_coords, dropoff_coords)
                duration_hours = distance_km / 60  # Assume 60 km/h
                polyline = [
                    [pickup_coords['lat'], pickup_coords['lng']],
                    [dropoff_coords['lat'], dropoff_coords['lng']]
                ]
            
            # Calculate trip plan
            current_cycle_used = float(request.data.get('current_cycle_used', 0))
            trip_plan = calculate_trip_plan(distance_km, current_cycle_used)
            
            # Generate separate log sheets for each day and attach to trip_plan
            logs = []
            for day_data in trip_plan['days']:
                log_sheet = generate_log_sheet(day_data)
                day_data['log_sheet'] = log_sheet  # Attach log_sheet to day data
                day_log = {
                    'day': day_data['day'],
                    'log': log_sheet
                }
                logs.append(day_log)

            # Validate trip plan
            validation = validate_trip_plan(trip_plan)
            
            # Save trip with plan and coordinates
            trip = serializer.save(
                distance_km=distance_km,
                current_lat=current_coords.get('lat'),
                current_lng=current_coords.get('lng'),
                pickup_lat=pickup_coords.get('lat'),
                pickup_lng=pickup_coords.get('lng'),
                dropoff_lat=dropoff_coords.get('lat'),
                dropoff_lng=dropoff_coords.get('lng')
            )
            trip.set_trip_plan(trip_plan)
            trip.save()
            
            # Return response with trip plan including logs, coordinates, and route
            response_serializer = TripSerializer(trip)
            response_data = response_serializer.data
            response_data['trip_plan'] = trip_plan
            response_data['coordinates'] = {
                'current': current_coords,
                'pickup': pickup_coords,
                'dropoff': dropoff_coords
            }
            response_data['route'] = {
                'distance_km': distance_km,
                'duration_hours': duration_hours,
                'polyline': polyline
            }
            
            # Add all stop points for map markers
            response_data['stop_points'] = {
                'fuel_stops': trip_plan.get('fuel_stops', []),
                'rest_stops': trip_plan.get('rest_stops', []),
                'break_points': trip_plan.get('break_points', [])
            }
            
            # Add logs array with separate log sheet for each day
            response_data['logs'] = logs

            # Add validation results
            response_data['validation'] = validation
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TripListView(APIView):
    def get(self, request):
        trips = Trip.objects.all().order_by('-created_at')
        serializer = TripSerializer(trips, many=True)
        return Response({
            'count': trips.count(),
            'trips': serializer.data
        })


class LogPDFView(APIView):
    def get(self, request):
        # Get trip_id from query params or use most recent trip
        trip_id = request.query_params.get('trip_id')
        
        if trip_id:
            try:
                trip = Trip.objects.get(id=trip_id)
            except Trip.DoesNotExist:
                return Response({'error': 'Trip not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Get most recent trip
            trip = Trip.objects.order_by('-id').first()
            if not trip:
                return Response({'error': 'No trips found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get trip plan and logs
        trip_plan = trip.get_trip_plan()
        if not trip_plan:
            return Response({'error': 'No trip plan found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate logs array
        from .utils import generate_log_sheet
        logs = []
        for day_data in trip_plan.get('days', []):
            day_log = {
                'day': day_data['day'],
                'log': generate_log_sheet(day_data)
            }
            logs.append(day_log)
        
        # Trip info for PDF header
        trip_info = {
            'current': trip.current_location,
            'pickup': trip.pickup_location,
            'dropoff': trip.dropoff_location
        }
        
        # Generate PDF
        pdf_buffer = generate_log_sheet_pdf(logs, trip_info)
        
        # Return as downloadable PDF
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f'trip_log_sheets_{trip.id}.pdf'
        )
        return response


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')

        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email)
        return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
