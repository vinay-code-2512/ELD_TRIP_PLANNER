import { useEffect, useState } from 'react'
import api from '../services/api'
import MapComponent from '../components/MapComponent'
import LogSheets from '../components/LogSheets'
import './TripList.css'

function TripList() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [tripDetails, setTripDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips/')
      setTrips(response.data.trips)
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewTripDetails = async (trip) => {
    setSelectedTrip(trip)
    setDetailsLoading(true)
    try {
      setTripDetails(trip)
    } catch (error) {
      console.error('Error:', error)
      setTripDetails(trip)
    } finally {
      setDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    setSelectedTrip(null)
    setTripDetails(null)
  }

  const downloadPDF = (tripId) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    window.open(`${baseUrl}/logs/pdf/?trip_id=${tripId}`, '_blank')
  }

  if (selectedTrip) {
    return (
      <div className="px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={closeDetails}
            className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            ← Back to List
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Trip Details</h2>
        </div>

        {detailsLoading ? (
          <div className="text-center p-8">Loading trip details...</div>
        ) : tripDetails && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold text-indigo-600 mb-3 sm:mb-4">
                {tripDetails.current_location} → {tripDetails.dropoff_location}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Distance</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800">{tripDetails.distance_km} km</p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Days</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800">{tripDetails.total_days || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Pickup</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800 truncate">{tripDetails.pickup_location}</p>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Cycle Used</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800">{tripDetails.current_cycle_used}h</p>
                </div>
              </div>
              <button
                onClick={() => downloadPDF(tripDetails.id)}
                className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                Download PDF
              </button>
            </div>

            {tripDetails.coordinates && (
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Route Map</h4>
                <div className="h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden">
                  <MapComponent
                    currentCoords={tripDetails.coordinates.current}
                    pickupCoords={tripDetails.coordinates.pickup}
                    dropoffCoords={tripDetails.coordinates.dropoff}
                    stopPoints={{ fuel_stops: [], rest_stops: [], break_points: [] }}
                  />
                </div>
              </div>
            )}

            {tripDetails.trip_plan && tripDetails.trip_plan.days && (
              <div className="space-y-4 sm:space-y-6">
                <h4 className="text-base sm:text-lg font-bold text-gray-800 px-2 sm:px-0">Log Sheets</h4>
                <LogSheets
                  logs={tripDetails.trip_plan.days.map(day => ({
                    day: day.day,
                    log: day.log_sheet || day.log
                  }))}
                  tripPlan={tripDetails.trip_plan}
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center p-8">Loading trips...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0">
      <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4 sm:mb-6">Trip History</h2>

      {trips.length === 0 ? (
        <div className="text-center p-8 text-gray-500">No trips saved yet.</div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 cursor-pointer hover:shadow-md transition trip-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              onClick={() => viewTripDetails(trip)}
            >
              <div className="flex-1 min-width-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2 truncate">
                  {trip.current_location} → {trip.dropoff_location}
                </h3>
                <p className="text-sm text-gray-600 mb-2 sm:mb-3">
                  Pickup: {trip.pickup_location}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                  <span>Distance: {trip.distance_km} km</span>
                  <span className="hidden sm:inline">|</span>
                  <span>Days: {trip.total_days || 'N/A'}</span>
                  <span className="hidden sm:inline">|</span>
                  <span>Created: {new Date(trip.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 button-group w-full sm:w-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadPDF(trip.id)
                  }}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                >
                  PDF
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    viewTripDetails(trip)
                  }}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-4 sm:mt-6 text-gray-600 text-sm sm:text-base">
        Total Trips: {trips.length}
      </div>
    </div>
  )
}

export default TripList
