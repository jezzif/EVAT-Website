import React, { useEffect, useState, useContext, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import { UserContext } from '../context/user';
import { predictWeatherAwareRouting } from '../services/weatherAwareRoutingService';
import LocateUser from './LocateUser';
import WeatherAwareSelection from './WeatherAwareSelection';
import WeatherAwareResult from './WeatherAwareResult';

// styles
import '../styles/Root.css';
import '../styles/Map.css';
import '../styles/Buttons.css';
import '../styles/Elements.css';
import '../styles/Fonts.css';

// Watches map bounds (bbox) and reports them upward
function BoundsWatcher({ onChange }) {
  const map = useMapEvents({
    moveend() {
      const b = map.getBounds();
      onChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    }
  });

  useEffect(() => {
    const b = map.getBounds();
    onChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
  }, [map, onChange]);

  return null;
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({
        lat: e.latlng.lat,
        lon: e.latlng.lng,
      });
    },
  });

  return null;
}

export default function Map() {
  const { user } = useContext(UserContext);

  const [bbox, setBbox] = useState(null);
  const [loading] = useState(false);

  // local UI state for the floating dark-mode button icon
  const [isDark, setIsDark] = useState(false);

  // New route selection state
  const [originLocation, setOriginLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [activeField, setActiveField] = useState("origin");
  const [acOn, setAcOn] = useState(true);

  const [weatherResult, setWeatherResult] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const handleLocationSelect = (location) => {
    if (activeField === "origin") {
      setOriginLocation(location);
      setActiveField("destination");
    } else {
      setDestinationLocation(location);
    }

    setWeatherResult(null);
    setWeatherError("");
  };

  const handleCalculateEnergy = async () => {
    if (!originLocation || !destinationLocation) {
      setWeatherError("Please select both origin and destination on the map.");
      return;
    }

    setWeatherLoading(true);
    setWeatherError('');

    try {
      const payload = {
        origin: `${originLocation.lat},${originLocation.lon}`,
        destination: `${destinationLocation.lat},${destinationLocation.lon}`,
        ac_on: acOn,
      };

      const data = await predictWeatherAwareRouting(payload, user?.token);
      setWeatherResult(data);
    } catch (error) {
      console.log(error);
      setWeatherError(error.message || "Something went wrong while calculating energy.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setOriginLocation(null);
    setDestinationLocation(null);
    setActiveField("origin");
    setAcOn(true);
    setWeatherResult(null);
    setWeatherError("");
  }, []);

  // toggle dark mode only when inside the Map page
  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    return () => {
      document.body.classList.remove("dark-mode");
    };
  }, [isDark]);

  return (
    <div className={`map-page ${isDark ? "dark" : ""}`}>
      <div className='container-map'>
        {!bbox && !loading && user?.token && (
          <div className="map-status-message map-info" style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            background: '#e3f2fd',
            color: '#1565c0',
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: 500,
            borderLeft: '4px solid #2196f3',
            maxWidth: '320px',
            lineHeight: '1.5'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              📍 Map Loading
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              Wait for map to load or move/zoom to search for chargers
            </div>
          </div>
        )}

        {!user?.token && (
          <div className="map-status-message map-warning" style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            background: '#fff3cd',
            color: '#856404',
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: 500,
            borderLeft: '4px solid #ffc107',
            maxWidth: '300px'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              ⚠️ Login Required
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              Please log in to use weather-aware routing
            </div>
          </div>
        )}

        <WeatherAwareSelection
          originLocation={originLocation}
          destinationLocation={destinationLocation}
          activeField={activeField}
          setActiveField={setActiveField}
          acOn={acOn}
          setAcOn={setAcOn}
          weatherError={weatherError}
          weatherLoading={weatherLoading}
          onClick={handleCalculateEnergy}
          handleReset={handleReset}
          isDark={isDark}
        />

        <MapContainer
          className="map-visible-area hide-scrollbar"
          center={[-37.8136, 144.9631]}
          zoom={13}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <BoundsWatcher onChange={setBbox} />
          <MapClickHandler onLocationSelect={handleLocationSelect} />

          {originLocation && (
            <Marker position={[originLocation.lat, originLocation.lon]} />
          )}

          {destinationLocation && (
            <Marker position={[destinationLocation.lat, destinationLocation.lon]} />
          )}

          <LocateUser />
        </MapContainer>

        {weatherResult && (
          <WeatherAwareResult weatherResult={weatherResult} isDark={isDark} />
        )}

        <button
          className="btn btn-primary btn-dark-mode"
          aria-label="Toggle dark mode"
          onClick={() => setIsDark(prev => !prev)}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '🌙' : '☀️'}
        </button>
      </div>
    </div>
  );
}