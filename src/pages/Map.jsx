import React, { useEffect, useState, useMemo, useContext } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import { UserContext } from '../context/user';
import { FavouritesContext } from '../context/FavouritesContext';
import { getChargers, getConnectorTypes, getOperatorTypes } from '../services/chargerService';
import { predictWeatherAwareRouting } from '../services/weatherAwareRoutingService';
import NavBar from '../components/NavBar';
import LocateUser from '../components/LocateUser';
import ClusterMarkers from '../components/ClusterMarkers';
import SmartFilter from '../components/SmartFilter';
import ChatBubble from "../components/ChatBubble";
import ChargerSideBar from '../components/ChargerSideBar';

// styles
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import '../styles/Root.css';
import '../styles/SmartFilter.css';
import '../styles/Map.css';
import '../styles/Buttons.css';
import '../styles/Elements.css';
import '../styles/Fonts.css';
import '../styles/Forms.css';
import '../styles/NavBar.css';
import '../styles/Sidebar.css';
import '../styles/Tables.css';
import '../styles/Validation.css';

// Configure default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Utility function to parse cost
function parseCost(costStr) {
  if (!costStr || typeof costStr !== "string") {
    return null; // return null if not parsable
  }

  const lower = costStr.toLowerCase().trim();

  // Handle free
  if (lower.includes("free")) return 0;

  // Handle cents (e.g., 55c)
  const centsMatch = lower.match(/([\d.]+)\s*(c|cent|cents)\b/);
  if (centsMatch) return parseInt(centsMatch[1], 10);

  // Handle $ amounts with optional per-unit info (e.g., $0.2/kwh, $0.60 per kwh)
  const dollarMatch = lower.match(/\$([\d.]+)/);
  if (dollarMatch) {
    const dollars = parseFloat(dollarMatch[1]);
    return Math.round(dollars * 100); // always return integer cents
  }

  // Fallback: parse any number in string
  const numMatch = lower.match(/([\d.]+)/);
  if (numMatch) return parseInt(numMatch[1], 10);

  // If nothing matches, return null
  return null;
}


//Define the same normalisation logic you used when fetching operator types in charger service
function normaliseOperatorName(name) {
  if (!name) return "Unknown";

  const lower = name.toLowerCase().trim();

  // Tesla group
  if (lower.includes("tesla")) {
    return "Tesla";
  }

  // Evie group
  if (lower.includes("evie")) {
    return "Evie";
  }

  // Pulse group
  if (lower.includes("pulse")) {
    return "BP Pulse";
  }

  // Ampcharge group
  if (lower.includes("ampcharge")) {
    return "Ampol Ampcharge";
  }

  // NRMA group
  if (lower.includes("nrma")) {
    return "NRMA";
  }

  // Unknown group
  if (lower.includes("unknown")) {
    return "Unknown";
  }

  return name;
}

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

  // define the minimum price of a charger and maximum here
  const priceMin = 0;
  const priceMax = 100;

  const [filters, setFilters] = useState({
    chargerType: [],
    chargingSpeed: [],
    priceRange: [priceMin, priceMax],
    operatorType: [],
    showOnlyAvailable: false,
    showCongestion: true
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [stations, setStations] = useState([]);
  const [bbox, setBbox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const { favourites, toggleFavourite } = useContext(FavouritesContext);
  const [connectorTypes, setConnectorTypes] = useState([]);
  const [operatorTypes, setOperatorTypes] = useState([]);

  // local UI state for the floating dark-mode button icon
  const [isDark, setIsDark] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [weatherYear, setWeatherYear] = useState(2023);
  const [weatherResult, setWeatherResult] = useState({
    prediction: null,
    dist_to_nearest_ev_m: null,
    ev_within_500m: null,
    avg_temp: null,
    total_prcp: null,
    used_SHAPE_Length: null
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const handleCalculateEnergy = async () => {
    if (!selectedLocation) {
      setWeatherError("Please click on the map to select a location first.");
      return;
    }

    setWeatherLoading(true);
    setWeatherError('');
    //setWeatherResult(null);

    try {
      const payload = {
        year: Number(weatherYear),
        start_lat: selectedLocation.lat,
        start_lon: selectedLocation.lon,
      };
      const data = await predictWeatherAwareRouting(payload, user?.token);
      setWeatherResult({...weatherResult,
        prediction: data.prediction,
        dist_to_nearest_ev_m: data.dist_to_nearest_ev_m,
        ev_within_500m: data.ev_within_500m,
        avg_temp: data.avg_temp,
        total_prcp: data.total_prcp,
        used_SHAPE_Length: data.used_SHAPE_Length});
    } catch (error) {
      console.log(error);
      setWeatherError(error.message || "Something went wrong while calculating energy.");
    } finally {
      setWeatherLoading(false);
    }
  };

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

  // Fetch chargers only when token available and bbox changes
  useEffect(() => {
    let mounted = true;
    let id;

    if (!user?.token) {
      setLoading(false);
      setErr('Please log in to search for charging stations');
      return;
    }

    const load = async () => {
      try {
        setErr('');
        
        // need bbox to fetch chargers
        if (!bbox) {
          if (mounted) {
            setLoading(false);
            setErr('');
          }
          return;
        }

        setLoading(true);
        const data = await getChargers(user, { bbox });
        if (mounted) {
          setStations(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setErr(e.message || 'Failed to load chargers');
          setLoading(false);
        }
      }
    };

    load();
    id = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [bbox, user?.token]);

  // fetching connector and operator types
  useEffect(() => {
    if (!user) return;

    async function fetchConnectorTypes() {
      try {
        const types = await getConnectorTypes(user);
        setConnectorTypes(types);
      } catch (err) {
        console.error("Failed to load connector types", err);
      }
    }

    async function fetchOperatorTypes() {
      try {
        const types = await getOperatorTypes(user);
        setOperatorTypes(types);
      } catch (err) {
        console.error("Failed to load operator types", err);
      }
    }

    fetchConnectorTypes();
    fetchOperatorTypes();
  }, [user]);
  //Type 2 tethered connector doesnt work because each station has a trailing space in the connector_types that we have filtered out in chargerservice.js

  // Apply filters on stations
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      const { connection_type, power_output, cost, operator } = station;
      // Charger type filter
      if (filters.chargerType.length > 0 && !filters.chargerType.includes(connection_type)) {
        return false;
      }

      //Speed filter
      if (filters.chargingSpeed.length > 0) {
        const speed = Number(power_output); // parse as number
        const ok = filters.chargingSpeed.some(range => {
          switch (range) {
            case '<7kW':
              return speed < 7;
            case '7-22kW':
              return speed >= 7 && speed <= 22;
            case '22-50kW':
              return speed > 22 && speed <= 50;
            case '50-150kW':
              return speed > 50 && speed <= 150;
            case '150kW-250kW':
              return speed > 150 && speed <= 250;
            case '250kW+':
              return speed > 250;
            default:
              return false;
          }
        });
        if (!ok) return false;
      }

      // Price filter      
      const price = parseCost(cost);
      // if (price === null) return false; // this will remove all 'unknown' costs
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;

      // Operator filter
      if (filters.operatorType.length > 0) {
        const normalisedOperator = normaliseOperatorName(operator);
        // Determine if operator is considered "Other"
        const bigGroups = operatorTypes.filter(op => op !== "Other");
        const opForFilter = bigGroups.includes(normalisedOperator) ? normalisedOperator : "Other";

        if (!filters.operatorType.includes(opForFilter)) {
          return false;
        }
      }

      // Available filter
      if (filters.showOnlyAvailable && station.is_operational !== 'true') {
        return false;
      }

      return true;
    });
  }, [stations, filters]);

  return (
    <div className={`map-page ${isDark ? "dark" : ""}`}>
      <NavBar />
      <div className='container-map'>
        <button 
          className="btn btn-primary btn-filter btn-small"
          onClick={() => setIsFilterOpen(true)}
        >
          🔍 Smart Filters
        </button>

        {loading && bbox && (
          <div className="map-status-message map-loading" style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            background: '#fff',
            padding: '8px 12px',
            borderRadius: 6,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '14px',
            fontWeight: 500
          }}>
            Loading charging stations…
          </div>
        )}
        {err && (
          <div className="map-status-message map-error" style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            background: '#ffebee',
            color: '#c62828',
            padding: '8px 12px',
            borderRadius: 6,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '14px',
            fontWeight: 500,
            borderLeft: '4px solid #f44336',
            maxWidth: '300px'
          }}>
            {err}
          </div>
        )}
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
              Please log in to search for charging stations
            </div>
          </div>
        )}

        <div style={{
          position: 'absolute',
          top: 90,
          left: 24,
          zIndex: 1000,
          background: '#ffffff',
          padding: '22px',
          borderRadius: '18px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          width: '320px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '800',
            marginBottom: '16px',
            color: '#111827'
          }}>
            Weather-Aware Routing
          </h2>

          <div style={{ fontSize: '14px', marginBottom: '12px', color: '#4b5563' }}>
            <p><strong>Lat:</strong> {selectedLocation?.lat.toFixed(5)}</p>
            <p><strong>Lon:</strong> {selectedLocation?.lon.toFixed(5)}</p>
          </div>

          <label style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Year
          </label>

          <input
            type="number"
            value={weatherYear}
            onChange={(e) => setWeatherYear(e.target.value)}
            style={{
              width: '90%',
              padding: '12px',
              marginTop: '6px',
              marginBottom: '14px',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              fontSize: '15px',
              outline: 'none'
            }}
          />

          <button
            onClick={handleCalculateEnergy}
            disabled={weatherLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(34,197,94,0.3)'
            }}
          >
            {weatherLoading ? "Calculating..." : "Calculate Energy"}
          </button>

          {weatherError && (
            <p style={{
              color: '#dc2626',
              marginTop: '10px',
              fontSize: '13px'
            }}>
              {weatherError}
            </p>
          )}
        </div>

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
          <MapClickHandler onLocationSelect={setSelectedLocation} />
          
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lon]} />
          )}
          <ClusterMarkers
            showCongestion={filters.showCongestion}
            stations={filteredStations}
            onSelectStation={(st) => setSelectedStation(st)}
          />
          <LocateUser />
        </MapContainer>

        {weatherResult.prediction && (
          <div style={{
            position: 'absolute',
            right: 24,
            bottom: 90,
            zIndex: 1000,
            background: '#ffffff',
            color: '#111827',
            opacity: 1,
            padding: '22px',
            borderRadius: '18px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            width: '340px'
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '800',
              marginBottom: '16px',
              color: '#111827'
            }}>
              ML Prediction Result
            </h2>

            <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
              <div><strong>Prediction:</strong> {weatherResult.prediction.toFixed(2)}</div>
              <div><strong>Nearest EV:</strong> {Math.round(weatherResult.dist_to_nearest_ev_m)} m</div>
              <div><strong>EV within 500m:</strong> {weatherResult.ev_within_500m ? "Yes" : "No"}</div>
              <div><strong>Avg Temp:</strong> {weatherResult.avg_temp.toFixed(1)} °C</div>
              <div><strong>Precipitation:</strong> {Math.round(weatherResult.total_prcp)}</div>
              <div><strong>Road Length:</strong> {weatherResult.used_SHAPE_Length.toFixed(2)}</div>
            </div>
          </div>)}

        <button
          className="btn btn-primary btn-dark-mode"
          aria-label="Toggle dark mode"
          onClick={() => setIsDark(prev => !prev)}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '🌙' : '☀️'}
        </button>

        <SmartFilter
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          setFilters={setFilters}
          filteredCount={filteredStations.length}
          priceMin={priceMin}
          priceMax={priceMax}
          connectorTypes={connectorTypes}
          operatorTypes={operatorTypes}
        />
        <ChargerSideBar
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          favourites={favourites}
          toggleFavourite={toggleFavourite}
        />
        <ChatBubble />
      </div>
    </div>
  );
}