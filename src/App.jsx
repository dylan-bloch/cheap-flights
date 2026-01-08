import { useState, useEffect, useRef } from "react"

// Simple icons as SVG components
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
)

const PlaneIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4s-2 1-3.5 2.5L11 10l-8.2 1.8c-.5.1-.8.6-.8 1.1s.5.9 1.1.8L11 12l4 4 1.2 7.9c.1.6.6 1.1 1.1.8s.9-.8.8-1.3L17.8 19.2z"></path>
  </svg>
)

const ChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CitySearchDropdown = ({ value, onChange, placeholder, label, id, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const handleToggle = () => {
    const newOpenState = !isOpen
    setIsOpen(newOpenState)
    if (onOpenChange) onOpenChange(newOpenState)
  }

  const handleClose = () => {
    setIsOpen(false)
    if (onOpenChange) onOpenChange(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search UNIFIED endpoint for both airports and cities
  useEffect(() => {
    if (searchTerm.length < 2) {
      setLocations([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      try {
        // ONE unified search endpoint
        const response = await fetch(
          `http://localhost:5000/api/locations/search?keyword=${encodeURIComponent(searchTerm)}`
        )
        const data = await response.json()

        console.log('🔍 Raw response:', data)

        // Normalize the data - backend sends 'lng' but we need to make sure it's consistent
        const locationsList = (data.locations || []).map(loc => ({
          ...loc,
          lng: loc.lng || loc.lon // ✅ Handle both 'lng' and 'lon'
        }))
        
        console.log('🔍 Normalized locations:', locationsList)
        setLocations(locationsList)
      } catch (err) {
        console.error('Failed to search locations:', err)
        setLocations([])
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchTerm])

  const selectedLocation = value

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        className={`dropdown-input ${isOpen ? 'dropdown-input-open' : ''}`}
        onClick={() => handleToggle()}
      >
        <span className={selectedLocation ? "text-gray-900" : "text-gray-400"}>
          {selectedLocation 
            ? selectedLocation.iata 
              ? `${selectedLocation.city} (${selectedLocation.iata})`
              : selectedLocation.name
            : placeholder}
        </span>
        <ChevronDown />
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-search-container">
            <div className="relative">
              <input
                type="text"
                className="dropdown-search-input"
                placeholder="Type city or airport name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              {searchTerm && (
                <button
                  className="dropdown-clear-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchTerm("")
                  }}
                >
                  <XIcon />
                </button>
              )}
            </div>
          </div>

          <div className="dropdown-results-container">
            {loading ? (
              <div className="dropdown-loading">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-blue-600"></div>
                <p className="mt-2 text-sm">Searching...</p>
              </div>
            ) : searchTerm.length < 2 ? (
              <div className="dropdown-empty">
                Type at least 2 characters to search
              </div>
            ) : locations.length === 0 ? (
              <div className="dropdown-empty">
                No locations found
                <div className="text-xs text-gray-400 mt-1">
                  Searched for: "{searchTerm}"
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-500 px-4 py-2">
                  {locations.length} results found
                </div>
                {locations.map((location, idx) => (
                  <div
                    key={`${location.type}-${location.iata || location.name}-${idx}`}
                    className={`dropdown-item ${value?.iata === location.iata || value?.name === location.name ? 'dropdown-item-selected' : ''}`}
                    onClick={() => {
                      console.log('📍 Selected location:', location)
                      onChange(location)
                      handleClose()
                      setSearchTerm("")
                    }}
                  >
                    <div className="dropdown-item-content">
                      <div className="dropdown-item-text">
                        <div className="font-medium text-gray-900">
                          {location.iata ? `${location.city} (${location.iata})` : location.name}
                        </div>
                        <div className="dropdown-item-subtext">
                          {location.iata && location.name !== location.city ? `${location.name} - ` : ''}
                          {location.admin_name && `${location.admin_name}, `}
                          {location.country}
                        </div>
                      </div>
                      <span className="dropdown-item-badge">
                        {location.type === 'AIRPORT' ? '✈️ Airport' : '🏙️ City'}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const RadiusSlider = ({ label, value, onChange, color }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className={`text-sm font-semibold ${color === "green" ? "text-green-600" : "text-blue-600"}`}>
          {value} miles
        </span>
      </div>
      <input
        type="range"
        min="10"
        max="200"
        value={value}
        onChange={(e) => onChange(Number.parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: color === "green" 
            ? `linear-gradient(to right, #10b981 0%, #10b981 ${((value - 10) / 190) * 100}%, #e5e7eb ${((value - 10) / 190) * 100}%, #e5e7eb 100%)`
            : `linear-gradient(to right, #2563eb 0%, #2563eb ${((value - 10) / 190) * 100}%, #e5e7eb ${((value - 10) / 190) * 100}%, #e5e7eb 100%)`
        }}
      />
    </div>
  )
}

const InteractiveMap = ({
  selectedOrigin,
  selectedDestination,
  originRadius,
  destinationRadius,
}) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({ origin: null, destination: null })
  const circlesRef = useRef([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return

    const map = window.L.map(mapRef.current).setView([20, 0], 2)
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!window.L || !mapInstanceRef.current) return

    if (markersRef.current.origin) markersRef.current.origin.remove()
    if (markersRef.current.destination) markersRef.current.destination.remove()

    if (selectedOrigin && selectedOrigin.lat && selectedOrigin.lng) {
      const displayCode = selectedOrigin.iata || selectedOrigin.name?.substring(0, 3).toUpperCase() || '?'
      
      const icon = window.L.divIcon({
        html: `<div style="
          background-color: #10b981;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
        ">${displayCode}</div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = window.L.marker([selectedOrigin.lat, selectedOrigin.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="text-align: center;">
            <div style="font-weight: bold; font-size: 16px; color: #10b981;">Origin</div>
            <div style="font-weight: bold; margin-top: 4px;">${selectedOrigin.iata || selectedOrigin.name}</div>
            <div style="color: #666; font-size: 12px;">${selectedOrigin.city}</div>
            ${selectedOrigin.iata ? `<div style="color: #666; font-size: 11px;">${selectedOrigin.name}</div>` : ''}
          </div>
        `)

      markersRef.current.origin = marker

      if (!selectedDestination) {
        mapInstanceRef.current.setView([selectedOrigin.lat, selectedOrigin.lng], 6)
      }
    }

    if (selectedDestination && selectedDestination.lat && selectedDestination.lng) {
      const displayCode = selectedDestination.iata || selectedDestination.name?.substring(0, 3).toUpperCase() || '?'
      
      const icon = window.L.divIcon({
        html: `<div style="
          background-color: #2563eb;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
        ">${displayCode}</div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = window.L.marker([selectedDestination.lat, selectedDestination.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="text-align: center;">
            <div style="font-weight: bold; font-size: 16px; color: #2563eb;">Destination</div>
            <div style="font-weight: bold; margin-top: 4px;">${selectedDestination.iata || selectedDestination.name}</div>
            <div style="color: #666; font-size: 12px;">${selectedDestination.city}</div>
            ${selectedDestination.iata ? `<div style="color: #666; font-size: 11px;">${selectedDestination.name}</div>` : ''}
          </div>
        `)

      markersRef.current.destination = marker

      if (selectedOrigin && selectedOrigin.lat && selectedOrigin.lng) {
        const bounds = window.L.latLngBounds([
          [selectedOrigin.lat, selectedOrigin.lng],
          [selectedDestination.lat, selectedDestination.lng]
        ])
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
      } else {
        mapInstanceRef.current.setView([selectedDestination.lat, selectedDestination.lng], 6)
      }
    }
  }, [selectedOrigin, selectedDestination])

  useEffect(() => {
  if (!window.L || !mapInstanceRef.current) return

  circlesRef.current.forEach(circle => circle.remove())
  circlesRef.current = []

  // Add origin circle - only if we have valid coordinates
  if (selectedOrigin && selectedOrigin.lat && selectedOrigin.lng && 
      !isNaN(selectedOrigin.lat) && !isNaN(selectedOrigin.lng)) {
    try {
      const circle = window.L.circle([selectedOrigin.lat, selectedOrigin.lng], {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.1,
        weight: 2,
        radius: originRadius * 1609.34
      }).addTo(mapInstanceRef.current)
      circlesRef.current.push(circle)
    } catch (error) {
      console.warn('Failed to add origin circle:', error)
    }
  }

  // Add destination circle - only if we have valid coordinates
  if (selectedDestination && selectedDestination.lat && selectedDestination.lng &&
      !isNaN(selectedDestination.lat) && !isNaN(selectedDestination.lng)) {
    try {
      const circle = window.L.circle([selectedDestination.lat, selectedDestination.lng], {
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.1,
        weight: 2,
        radius: destinationRadius * 1609.34
      }).addTo(mapInstanceRef.current)
      circlesRef.current.push(circle)
    } catch (error) {
      console.warn('Failed to add destination circle:', error)
    }
  }
}, [selectedOrigin, selectedDestination, originRadius, destinationRadius])

  return (
    <div 
      ref={mapRef} 
      className="rounded-xl overflow-hidden shadow-inner" 
      style={{ height: "400px", width: "100%" }}
    />
  )
}

const FlightResults = ({ flights, loading }) => {
  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const parseDuration = (duration) => {
    // Duration format: PT2H30M
    const match = duration.match(/PT(\d+H)?(\d+M)?/)
    if (!match) return duration
    
    const hours = match[1] ? parseInt(match[1]) : 0
    const minutes = match[2] ? parseInt(match[2]) : 0
    
    if (hours && minutes) return `${hours}h ${minutes}m`
    if (hours) return `${hours}h`
    if (minutes) return `${minutes}m`
    return duration
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600 font-medium">Searching for the best flights...</p>
      </div>
    )
  }

  if (!flights || flights.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <div className="mx-auto w-12 h-12 text-gray-400">
          <PlaneIcon />
        </div>
        <p className="mt-4 text-gray-600">No flights found. Try adjusting your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Available Flights</h3>
        <span className="text-sm text-gray-600">{flights.length} results</span>
      </div>
      
      {flights.map((flight, index) => {
        const outbound = flight.outbound
        const inbound = flight.inbound
        
        // Calculate connections for outbound
        const firstItinerary = flight.itineraries?.[0]
        const segments = firstItinerary?.segments || []
        const numConnections = segments.length > 0 ? segments.length - 1 : 0

        return (
            <div key={flight.id || `${flight.airline?.code}-${outbound?.origin}-${outbound?.destination}-${index}`}
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 transition-all">

            {/* Airline Logo + Name */}
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={flight.airline?.logo || "https://via.placeholder.com/40"} 
                alt={flight.airline?.name || flight.airline?.code}
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/40?text=?"
                }}
              />
              
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {flight.airline?.name || flight.airline?.code}
                </div>
                <div className="text-xs text-gray-500">
                  {flight.airline?.code}
                </div>
              </div>
            </div>
            
            {/* Outbound Flight */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Outbound</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">{flight.airline?.code}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {numConnections === 0 ? 'Direct' : `${numConnections} stop${numConnections > 1 ? 's' : ''}`}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-gray-900">{outbound.origin}</div>
                  <div className="text-sm text-gray-600 mt-1">{formatDate(outbound.departureTime)}</div>
                  <div className="text-lg text-gray-700 font-semibold">{formatTime(outbound.departureTime)}</div>
                </div>

                <div className="flex-1 px-4 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="h-0.5 bg-gray-300 flex-1"></div>
                    <div className="mx-2 text-gray-400">
                      <PlaneIcon />
                    </div>
                    <div className="h-0.5 bg-gray-300 flex-1"></div>
                  </div>
                  <div className="text-sm text-gray-500">{parseDuration(outbound.duration)}</div>
                </div>

                <div className="flex-1 text-right">
                  <div className="text-3xl font-bold text-gray-900">{outbound.destination}</div>
                  <div className="text-sm text-gray-600 mt-1">{formatDate(outbound.arrivalTime)}</div>
                  <div className="text-lg text-gray-700 font-semibold">{formatTime(outbound.arrivalTime)}</div>
                </div>
              </div>
            </div>

            {inbound && (
              <>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Return</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">{flight.airline?.code}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {flight.itineraries?.[1]?.segments ? 
                        (flight.itineraries[1].segments.length - 1 === 0 
                          ? 'Direct' 
                          : `${flight.itineraries[1].segments.length - 1} stop${flight.itineraries[1].segments.length - 1 > 1 ? 's' : ''}`)
                        : 'Direct'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-3xl font-bold text-gray-900">{inbound.origin}</div>
                      <div className="text-sm text-gray-600 mt-1">{formatDate(inbound.departureTime)}</div>
                      <div className="text-lg text-gray-700 font-semibold">{formatTime(inbound.departureTime)}</div>
                    </div>

                    <div className="flex-1 px-4 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <div className="h-0.5 bg-gray-300 flex-1"></div>
                        <div className="mx-2 text-gray-400">
                          <PlaneIcon />
                        </div>
                        <div className="h-0.5 bg-gray-300 flex-1"></div>
                      </div>
                      <div className="text-sm text-gray-500">{parseDuration(inbound.duration)}</div>
                    </div>

                    <div className="flex-1 text-right">
                      <div className="text-3xl font-bold text-gray-900">{inbound.destination}</div>
                      <div className="text-sm text-gray-600 mt-1">{formatDate(inbound.arrivalTime)}</div>
                      <div className="text-lg text-gray-700 font-semibold">{formatTime(inbound.arrivalTime)}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Price and Book Button */}
            <div className="border-t border-gray-200 pt-4 mt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Price</div>
                <div className="text-3xl font-bold text-green-600">
                  {flight.currency} ${parseFloat(flight.price).toFixed(2)}
                </div>
              </div>
              <button 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                onClick={() => {
                  alert('Booking functionality coming soon!')
                }}
              >
                Select Flight
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function App() {
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [originRadius, setOriginRadius] = useState(50)
  const [destinationRadius, setDestinationRadius] = useState(50)
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showMap, setShowMap] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [originDropdownOpen, setOriginDropdownOpen] = useState(false)
  const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      if (window.L) {
        delete window.L.Icon.Default.prototype._getIconUrl
        window.L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
      }
      setLeafletLoaded(true)
    }
    document.body.appendChild(script)

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link)
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [])

const handleSearch = async () => {
  if (!origin || !destination || !departureDate) {
    setError("Please fill in origin, destination, and departure date.")
    return
  }

  console.log('🔍 Origin data:', origin)
  console.log('🔍 Destination data:', destination)

  setError("")
  setLoading(true)
  setShowMap(false)

  try {
    const params = new URLSearchParams({
      departureDate,
    })

    if (returnDate) {
      params.append('returnDate', returnDate)
    }

    // Check type first - if CITY, always use lat/lng even if it has an IATA code
    if (origin.type === 'CITY' && origin.lat && origin.lng) {
      console.log('🏙️ Using origin city coords:', origin.lat, origin.lng)
      params.append('originLat', origin.lat)
      params.append('originLng', origin.lng)
      params.append('originRadius', originRadius)
    } else if (origin.iata) {
      console.log('✈️ Using origin airport:', origin.iata)
      params.append('origins', origin.iata)
    }

    // Same for destination
    if (destination.type === 'CITY' && destination.lat && destination.lng) {
      console.log('🏙️ Using destination city coords:', destination.lat, destination.lng)
      params.append('destLat', destination.lat)
      params.append('destLng', destination.lng)
      params.append('destinationRadius', destinationRadius)
    } else if (destination.iata) {
      console.log('✈️ Using destination airport:', destination.iata)
      params.append('destinations', destination.iata)
    }

    console.log('📤 Request params:', params.toString())

    const response = await fetch(
      `http://localhost:5000/api/flights/search?${params.toString()}`
    )
    const data = await response.json()
    
    if (data.error) {
      setError(data.error)
      setFlights([])
      return
    }
    
    let flightsData = data.flights || data.data || [];

    // Sort by price ascending
    flightsData = flightsData.sort((a, b) => a.price - b.price);

    // Limit to cheapest 15 flights
    flightsData = flightsData.slice(0, 15);

    setFlights(flightsData);
    
    if (flightsData.length === 0) {
      setError("No flights found for the selected route and dates.")
    }
  } catch (err) {
    console.error(err)
    setError("Failed to fetch flights. Please try again.")
  }
  setLoading(false)
}

  const handleReset = () => {
    setShowMap(true)
    setFlights([])
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-green-600 p-3 rounded-xl text-white">
              <PlaneIcon />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FlightFinder</h1>
              <p className="text-sm text-gray-600">Find the cheapest flights across multiple airports worldwide</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-md p-6 space-y-6 lg:sticky lg:top-8">
              <h2 className="text-xl font-bold text-gray-800">Search Settings</h2>

              <div className="space-y-4">
                <div style={{ position: 'relative', zIndex: originDropdownOpen ? 1000 : 1 }}>
                  <CitySearchDropdown
                    value={origin}
                    onChange={(val) => {
                      setOrigin(val)
                    }}
                    onOpenChange={setOriginDropdownOpen}
                    placeholder="Select origin city or airport"
                    label="Origin"
                    id="origin"
                  />
                </div>

                <div style={{ position: 'relative', zIndex: destinationDropdownOpen ? 1000 : 1, visibility: originDropdownOpen ? 'hidden' : 'visible' }}>
                  <CitySearchDropdown
                    value={destination}
                    onChange={(val) => {
                      setDestination(val)
                    }}
                    onOpenChange={setDestinationDropdownOpen}
                    placeholder="Select destination city or airport"
                    label="Destination"
                    id="destination"
                  />
                </div>

                <div className="pt-2" style={{ visibility: originDropdownOpen ? 'hidden' : 'visible' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departure Date</label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div style={{ visibility: originDropdownOpen ? 'hidden' : 'visible' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Return Date (Optional)</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200" style={{ visibility: originDropdownOpen ? 'hidden' : 'visible' }}>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Search Radius</h3>
                <p className="text-xs text-gray-500">Include nearby airports within this distance</p>
                <RadiusSlider label="Origin Radius" value={originRadius} onChange={setOriginRadius} color="green" />
                <RadiusSlider
                  label="Destination Radius"
                  value={destinationRadius}
                  onChange={setDestinationRadius}
                  color="blue"
                />
              </div>

              <div className="space-y-2 pt-4" style={{ visibility: originDropdownOpen ? 'hidden' : 'visible' }}>
                <button
                  onClick={handleSearch}
                  disabled={!origin || !destination || !departureDate}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <SearchIcon />
                  Search Flights
                </button>
                {!showMap && (
                  <button
                    onClick={handleReset}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    New Search
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              {showMap ? (
                <>
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Search Worldwide</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Select any city or airport in the world using the dropdowns above
                    </p>
                  </div>
                  {leafletLoaded ? (
                    <InteractiveMap
                      selectedOrigin={origin}
                      selectedDestination={destination}
                      originRadius={originRadius}
                      destinationRadius={destinationRadius}
                    />
                  ) : (
                    <div className="h-96 flex items-center justify-center bg-gray-100 rounded-xl">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading map...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <FlightResults flights={flights} loading={loading} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App