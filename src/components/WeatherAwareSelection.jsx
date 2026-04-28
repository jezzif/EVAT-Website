import React from "react";

export default function WeatherAwareSelection({selectedLocation, weatherYear, setWeatherYear, weatherLoading, weatherError, onClick}) {
    return (
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
            //onClick={handleCalculateEnergy}
            onClick={onClick}
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
    );
}