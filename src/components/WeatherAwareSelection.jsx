import React from "react";
import { useNavigate } from "react-router-dom";

import "../styles/Map.css";
import "../styles/Buttons.css";

export default function WeatherAwareSelection({
  originLocation,
  destinationLocation,
  activeField,
  setActiveField,
  acOn,
  setAcOn,
  weatherLoading,
  weatherError,
  onClick,
  handleReset,
  isDark,
}) {
  const navigate = useNavigate();

  const formatLocation = (location) => {
    if (!location) return "";
    return `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`;
  };

  const inputStyle = (fieldName) => ({
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    marginTop: "6px",
    borderRadius: "10px",
    border: activeField === fieldName ? "2px solid #22c55e" : "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    backgroundColor: activeField === fieldName ? "#f0fdf4" : "#ffffff",
    color: "#111827",
    cursor: "pointer",
  });

  const helperTextStyle = () => ({
    marginTop: "6px",
    marginBottom: "12px",
    padding: "7px 10px",
    borderRadius: "8px",
    backgroundColor: "#ecfdf5",
    color: "#166534",
    fontSize: "12px",
    fontWeight: "700",
    textAlign: "center",
  });

  const showOriginHelper = activeField === "origin" && !originLocation;
  const showDestinationHelper = activeField === "destination" && !destinationLocation;
  const bothSelected = originLocation && destinationLocation;

  return (
    <div
      className={`overlay ${isDark ? "dark" : ""}`}
      style={{
        top: 90,
        left: 24,
        width: 330,
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "800",
          marginBottom: "12px",
          color: "#111827",
        }}
      >
        Weather-Aware Routing
      </h2>

      <p
        style={{
          fontSize: "13px",
          color: "#4b5563",
          marginBottom: "14px",
          lineHeight: "1.4",
        }}
      >
        Select origin and destination using the map.
      </p>

      <label style={{ fontSize: "14px", fontWeight: "700" }}>
        Origin
      </label>
      <input
        type="text"
        readOnly
        value={formatLocation(originLocation)}
        placeholder="Click here, then select origin"
        onFocus={() => setActiveField("origin")}
        onClick={() => setActiveField("origin")}
        style={inputStyle("origin")}
      />

      {showOriginHelper && !bothSelected && (
        <div style={helperTextStyle()}>
          Map click will place origin
        </div>
      )}

      <label style={{ fontSize: "14px", fontWeight: "700" }}>
        Destination
      </label>
      <input
        type="text"
        readOnly
        value={formatLocation(destinationLocation)}
        placeholder="Click here, then select destination"
        onFocus={() => setActiveField("destination")}
        onClick={() => setActiveField("destination")}
        style={inputStyle("destination")}
      />

      {showDestinationHelper && !bothSelected && (
        <div style={helperTextStyle()}>
          Map click will place destination
        </div>
      )}

      <div
        style={{
          marginTop: "12px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: "700",
            color: "#111827",
          }}
        >
          AC {acOn ? "On" : "Off"}
        </span>

        <button
          type="button"
          onClick={() => setAcOn(!acOn)}
          aria-label="Toggle AC"
          style={{
            width: "54px",
            height: "30px",
            borderRadius: "999px",
            border: "none",
            padding: "3px",
            backgroundColor: acOn ? "#22c55e" : "#d1d5db",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: acOn ? "flex-end" : "flex-start",
            transition: "0.2s ease",
          }}
        >
          <span
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              display: "block",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          />
        </button>
      </div>

      <button
        onClick={onClick}
        disabled={weatherLoading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "none",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff",
          fontSize: "16px",
          fontWeight: "700",
          cursor: weatherLoading ? "not-allowed" : "pointer",
          opacity: weatherLoading ? 0.8 : 1,
          boxShadow: "0 6px 18px rgba(34,197,94,0.3)",
        }}
      >
        {weatherLoading ? "Calculating..." : "Calculate Energy"}
      </button>

      <button
        onClick={handleReset}
        style={{
          width: "100%",
          marginTop: "10px",
          padding: "14px",
          backgroundColor: "#f0f0f0",
          color: "#333",
          border: "1px solid #ddd",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "16px",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)",
        }}
      >
        Reset
      </button>

      {weatherError && (
        <p
          style={{
            color: "#dc2626",
            marginTop: "10px",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          {weatherError}
        </p>
      )}

      <hr className="separator" />

      <button
        onClick={() => navigate("/profile")}
        style={{
          width: "100%",
          marginTop: "10px",
          padding: "14px",
          backgroundColor: "#f0f0f0",
          color: "#333",
          border: "1px solid #ddd",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "16px",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)",
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}