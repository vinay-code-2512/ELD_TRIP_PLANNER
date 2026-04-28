import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import api from './services/api'
import Login from './pages/Login'
import Register from './pages/Register'
import MapComponent from './components/MapComponent'
import LogSheets from './components/LogSheets'
import TripTimeline from './components/TripTimeline'
import TripList from './pages/TripList'
import './App.css'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const [view, setView] = useState('form')
  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [backendCoords, setBackendCoords] = useState(null)
  const [tripPlan, setTripPlan] = useState(null)
  const [routeData, setRouteData] = useState(null)
  const [error, setError] = useState('')
  const [validation, setValidation] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: 'success' })
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toast.show])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
    if (validation) setValidation(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    setTripPlan(null)
    setBackendCoords(null)
    setRouteData(null)

    try {
      const data = {
        ...formData,
        current_cycle_used: parseFloat(formData.current_cycle_used)
      }
      const response = await api.post('/trip/', data)
      setTripPlan(response.data.trip_plan)
      setValidation(response.data.validation)
      setBackendCoords(response.data.coordinates)
      showToast('Trip created successfully!', 'success')
      if (response.data.route) {
        setRouteData(response.data.route)
      }
      } catch (err) {
        if (err.response?.status === 400) {
          const errorData = err.response.data
          if (typeof errorData === 'string') {
            showToast(errorData, 'error')
          } else if (errorData?.error) {
            showToast(errorData.error, 'error')
          } else {
            showToast('Invalid input. Please check your form data.', 'error')
          }
        } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          showToast('Network error. Please check your connection and ensure the backend server is running.', 'error')
        } else if (err.response?.status === 401) {
          showToast('Your session has expired. Please log in again.', 'error')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setTimeout(() => window.location.href = '/login', 2000)
        } else if (err.response?.status === 404) {
          showToast('Service not found. Please check your locations and try again.', 'error')
        } else {
          showToast('Failed to create trip. Please try again.', 'error')
        }
    } finally {
      setLoading(false)
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-2 sm:p-4">
                <div className="w-full max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">ELD Trip Planner</h1>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setView(view === 'form' ? 'trips' : 'form')}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all duration-300 text-sm font-semibold"
                      >
                        {view === 'form' ? 'View Trips' : 'New Trip'}
                      </button>
                      <button
                        onClick={() => {
                          localStorage.removeItem('access_token')
                          localStorage.removeItem('refresh_token')
                          window.location.href = '/login'
                        }}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 text-sm font-semibold"
                      >
                        Logout
                      </button>
                    </div>
                  </div>

                  {view === 'trips' ? (
                    <TripList />
                  ) : (
                    <>
                      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div>
                          <label htmlFor="current_location" className="block text-sm font-semibold text-gray-700 mb-2">
                            Current Location
                          </label>
                          <input
                            type="text"
                            id="current_location"
                            name="current_location"
                            placeholder="Enter current location"
                            value={formData.current_location}
                            onChange={handleChange}
                            required
                            className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-base"
                          />
                        </div>

                        <div>
                          <label htmlFor="pickup_location" className="block text-sm font-semibold text-gray-700 mb-2">
                            Pickup Location
                          </label>
                          <input
                            type="text"
                            id="pickup_location"
                            name="pickup_location"
                            placeholder="Enter pickup location"
                            value={formData.pickup_location}
                            onChange={handleChange}
                            required
                            className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-base"
                          />
                        </div>

                        <div>
                          <label htmlFor="dropoff_location" className="block text-sm font-semibold text-gray-700 mb-2">
                            Dropoff Location
                          </label>
                          <input
                            type="text"
                            id="dropoff_location"
                            name="dropoff_location"
                            placeholder="Enter dropoff location"
                            value={formData.dropoff_location}
                            onChange={handleChange}
                            required
                            className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-base"
                          />
                        </div>

                        <div>
                          <label htmlFor="current_cycle_used" className="block text-sm font-semibold text-gray-700 mb-2">
                            Current Cycle Used (hours)
                          </label>
                          <input
                            type="number"
                            id="current_cycle_used"
                            name="current_cycle_used"
                            placeholder="Enter hours used"
                            value={formData.current_cycle_used}
                            onChange={handleChange}
                            step="0.1"
                            min="0"
                            required
                            className="w-full px-3 sm:px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-base"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-base"
                        >
                          {loading ? 'Calculating...' : 'Create Trip'}
                        </button>
                      </form>

                      {/* Toast Notification */}
                      {toast.show && (
                        <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-[90vw] sm:max-w-sm">
                          <div className={`${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-2xl flex items-center gap-2 sm:gap-3`}>
                            <span className="text-lg sm:text-xl font-bold">{toast.type === 'success' ? '✓' : '✕'}</span>
                            <span className="flex-1 font-medium text-sm sm:text-base">{toast.message}</span>
                            <button
                              onClick={() => setToast({ show: false, message: '', type: 'success' })}
                              className="text-white hover:text-gray-200 transition-colors text-lg sm:text-xl leading-none"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Validation Warnings */}
                      {validation && !validation.valid && (
                        <div className="mt-4 sm:mt-6 p-4 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200 animate-fade-in">
                          <div className="flex items-start gap-2">
                            <span>⚠️</span>
                            <div>
                              <strong className="font-bold">HOS Compliance Warnings:</strong>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {validation.errors.map((err, idx) => (
                                  <li key={idx} className="text-sm">{err}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Loading Overlay */}
                      {loading && (
                        <div className="mt-6 sm:mt-8 p-6 sm:p-8 bg-white rounded-xl shadow-sm animate-fade-in">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative">
                              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-200"></div>
                              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
                            </div>
                            <div className="text-center">
                              <p className="text-base sm:text-lg font-semibold text-gray-700">Calculating Trip Plan</p>
                              <p className="text-sm text-gray-500 mt-1">Processing route, HOS rules, and generating logs...</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Trip Plan Results */}
                      {!loading && tripPlan && (
                        <div className="mt-6 sm:mt-8 animate-fade-in-up">
                          <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4 sm:mb-6">Trip Plan & Log Sheets</h2>

                          {routeData && (
                            <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-sm">
                                <div>
                                  <strong>Route Distance:</strong> {routeData.distance_km} km
                                </div>
                                <div>
                                  <strong>Est. Driving Time:</strong> {routeData.duration_hours} hours
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Day Cards */}
                          <LogSheets
                            logs={routeData?.logs}
                            tripPlan={tripPlan}
                            validationErrors={validation?.errors}
                          />

                          {/* Trip Timeline */}
                          <TripTimeline logs={routeData?.logs} tripPlan={tripPlan} />
                        </div>
                      )}

                      {/* Map */}
                      {!loading && backendCoords && (
                        <div className="mt-6 sm:mt-8">
                          <div className="h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-xl overflow-hidden">
                            <MapComponent
                              currentCoords={backendCoords?.current}
                              pickupCoords={backendCoords?.pickup}
                              dropoffCoords={backendCoords?.dropoff}
                              stopPoints={routeData?.stop_points}
                              routePolyline={routeData?.polyline}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
