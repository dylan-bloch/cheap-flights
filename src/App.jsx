import React, { useState } from "react";
import "./App.css";

// Simple icons as SVG components
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const PlaneIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4s-2 1-3.5 2.5L11 10l-8.2 1.8c-.5.1-.8.6-.8 1.1s.5.9 1.1.8L11 12l4 4 1.2 7.9c.1.6.6 1.1 1.1.8s.9-.8.8-1.3L17.8 19.2z"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

// Interactive Map Component
const InteractiveMap = ({ onLocationSelect, selectedOrigin, selectedDestination }) => {
  const [selectingFor, setSelectingFor] = useState("origin");

  // Sample airports for demonstration
  const airports = [
    { code: "ATL", name: "Atlanta", x: 30, y: 60 },
    { code: "JFK", name: "New York JFK", x: 80, y: 40 },
    { code: "LAX", name: "Los Angeles", x: 15, y: 65 },
    { code: "ORD", name: "Chicago O'Hare", x: 50, y: 45 },
    { code: "DFW", name: "Dallas/Fort Worth", x: 40, y: 70 },
    { code: "DEN", name: "Denver", x: 35, y: 50 },
    { code: "LAS", name: "Las Vegas", x: 20, y: 60 },
    { code: "PHX", name: "Phoenix", x: 25, y: 70 },
    { code: "SEA", name: "Seattle", x: 10, y: 20 },
    { code: "MIA", name: "Miami", x: 75, y: 85 },
  ];

  const handleMapClick = (airport) => {
    onLocationSelect({ code: airport.code, name: airport.name }, selectingFor);
    if (selectingFor === "origin") {
      setSelectingFor("destination");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectingFor("origin")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            selectingFor === "origin"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Select Origin
        </button>
        <button
          onClick={() => setSelectingFor("destination")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            selectingFor === "destination"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Select Destination
        </button>
      </div>

      <div className="relative bg-blue-50 rounded-lg overflow-hidden" style={{ height: "300px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-green-100">
          {airports.map((airport) => (
            <button
              key={airport.code}
              onClick={() => handleMapClick(airport)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-full transition-all hover:scale-110 ${
                selectedOrigin === airport.code
                  ? "bg-green-600 text-white shadow-lg"
                  : selectedDestination === airport.code
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 shadow-md hover:shadow-lg"
              }`}
              style={{ left: `${airport.x}%`, top: `${airport.y}%` }}
              title={`${airport.name} (${airport.code})`}
            >
              <MapPinIcon />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Flight Results Component
const FlightResults = ({ flights, loading }) => {
  if (loading) {
    return <div>Loading flights...</div>;
  }

  if (!flights.length) {
    return <div>No flights found.</div>;
  }

  return (
    <div>
      {flights.map((flight, index) => (
        <div key={index}>
          <span>
            {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || "N/A"} →{" "}
            {flight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode || "N/A"}
          </span>
          <span>
            {flight.price?.currency} {flight.price?.total}
          </span>
        </div>
      ))}
    </div>
  );
};

// Main App Component
function App() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMap, setShowMap] = useState(true);

  const handleLocationSelect = (location, type) => {
    if (type === "origin") {
      setOrigin(location.code);
    } else {
      setDestination(location.code);
    }
  };

  const handleSearch = async () => {
    if (!origin || !destination || !departureDate) {
      setError("Please fill in origin, destination, and departure date.");
      return;
    }

    setError("");
    setLoading(true);
    setShowMap(false);

    try {
      const response = await fetch(
        `http://localhost:5000/api/flights/search?origins=${origin}&destinations=${destination}&departureDate=${departureDate}&returnDate=${returnDate}`
      );
      const data = await response.json();
      setFlights(data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch flights. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Flight Finder</h1>
      {showMap ? (
        <InteractiveMap
          onLocationSelect={handleLocationSelect}
          selectedOrigin={origin}
          selectedDestination={destination}
        />
      ) : (
        <FlightResults flights={flights} loading={loading} />
      )}
      <button onClick={handleSearch}>Search</button>
    </div>
  );
}

export default App;
