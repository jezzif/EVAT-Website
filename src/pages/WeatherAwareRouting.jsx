import { useState } from "react";

const WeatherAwareRouting = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [result, setResult] = useState(null);

  const handleMapClick = () => {
    // temporary dummy values (we connect real map later)
    setSelectedLocation({
      lat: -37.8136,
      lon: 144.9631,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Weather-Aware Routing</h2>

      {/* Map Section */}
      <div
        style={{
          height: "300px",
          background: "#ddd",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        onClick={handleMapClick}
      >
        Click here to select location (dummy map)
      </div>

      {/* Selected Location */}
      {selectedLocation && (
        <div>
          <p>Lat: {selectedLocation.lat}</p>
          <p>Lon: {selectedLocation.lon}</p>
        </div>
      )}

      {/* Button */}
      <button>Calculate Energy</button>

      {/* Result */}
      {result && (
        <div>
          <h3>Result</h3>
        </div>
      )}
    </div>
  );
};

export default WeatherAwareRouting;