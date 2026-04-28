import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from 'leaflet'

const createCustomIcon = (color) => {
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })
}

const pickupIcon = createCustomIcon('green')
const dropoffIcon = createCustomIcon('red')
const currentIcon = createCustomIcon('blue')

// Fuel icon (orange)
const fuelIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Rest icon (purple)
const restIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Break icon (yellow)
const breakIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

function MapComponent({ currentCoords, pickupCoords, dropoffCoords, stopPoints, routePolyline }) {
  if (!pickupCoords || !dropoffCoords) {
    return <div className="text-center p-8 text-gray-500">Enter pickup and dropoff locations to see the route</div>
  }

  // Convert to array format for Leaflet if needed
  const currentPos = currentCoords?.lat ? [currentCoords.lat, currentCoords.lng] : currentCoords
  const pickupPos = pickupCoords.lat ? [pickupCoords.lat, pickupCoords.lng] : pickupCoords
  const dropoffPos = dropoffCoords.lat ? [dropoffCoords.lat, dropoffCoords.lng] : dropoffCoords

  // Calculate center from all available points
  const positions = [pickupPos, dropoffPos]
  if (currentPos) positions.push(currentPos)
  
  const center = [
    positions.reduce((sum, pos) => sum + pos[0], 0) / positions.length,
    positions.reduce((sum, pos) => sum + pos[1], 0) / positions.length
  ]

  // Use route polyline if available, otherwise straight line
  const routePositions = routePolyline && routePolyline.length > 0 
    ? routePolyline 
    : [pickupPos, dropoffPos]

  // Calculate stop positions along the route (interpolate between pickup and dropoff)
  const getStopPosition = (distanceFromStart, totalDistance) => {
    const ratio = distanceFromStart / totalDistance
    return [
      pickupPos[0] + (dropoffPos[0] - pickupPos[0]) * ratio,
      pickupPos[1] + (dropoffPos[1] - pickupPos[1]) * ratio
    ]
  }

  // Total distance for interpolation
  const totalDistance = routePolyline && routePolyline.length > 0 
    ? routePolyline.length * 1000 // Approximate
    : 4000 // Default

  return (
    <MapContainer center={center} zoom={10} className="h-96 w-full rounded-xl shadow-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Current Location Marker */}
      {currentPos && (
        <Marker position={currentPos} icon={currentIcon}>
          <Popup>
            <div>
              <strong>Current Location</strong>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Pickup Location Marker */}
      <Marker position={pickupPos} icon={pickupIcon}>
        <Popup>
          <div>
            <strong>Pickup Location</strong>
          </div>
        </Popup>
      </Marker>
      
      {/* Dropoff Location Marker */}
      <Marker position={dropoffPos} icon={dropoffIcon}>
        <Popup>
          <div>
            <strong>Dropoff Location</strong>
          </div>
        </Popup>
      </Marker>
      
      {/* Fuel stop markers */}
      {stopPoints?.fuel_stops?.map((stop, index) => {
        const position = getStopPosition(stop.distance_from_start, totalDistance)
        return (
          <Marker key={`fuel-${index}`} position={position} icon={fuelIcon}>
            <Popup>
              <div>
                <strong>Fuel Stop {index + 1}</strong><br />
                <strong>Type:</strong> Fuel Stop<br />
                <strong>Day:</strong> {stop.day}<br />
                <strong>Distance:</strong> {stop.distance_from_start.toFixed(0)} km<br />
                <strong>Location:</strong> {stop.location}
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Rest stop markers */}
      {stopPoints?.rest_stops?.map((stop, index) => {
        const position = getStopPosition(stop.distance_from_start, totalDistance)
        return (
          <Marker key={`rest-${index}`} position={position} icon={restIcon}>
            <Popup>
              <div>
                <strong>Rest Stop {index + 1}</strong><br />
                <strong>Type:</strong> Rest Stop<br />
                <strong>Day:</strong> {stop.day}<br />
                <strong>Distance:</strong> {stop.distance_from_start.toFixed(0)} km<br />
                <strong>Reason:</strong> {stop.reason}
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Break point markers */}
      {stopPoints?.break_points?.map((stop, index) => {
        const position = getStopPosition(stop.distance_from_start, totalDistance)
        return (
          <Marker key={`break-${index}`} position={position} icon={breakIcon}>
            <Popup>
              <div>
                <strong>Break Point {index + 1}</strong><br />
                <strong>Type:</strong> 30-Minute Break<br />
                <strong>Day:</strong> {stop.day}<br />
                <strong>Distance:</strong> {stop.distance_from_start.toFixed(0)} km<br />
                <strong>Duration:</strong> {stop.duration}<br />
                <strong>Reason:</strong> {stop.reason}
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Route polyline */}
      <Polyline positions={routePositions} color="blue" weight={3} opacity={0.8} />
    </MapContainer>
  )
}

export default MapComponent
