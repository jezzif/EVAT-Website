import React from "react";

export default function WeatherAwareResult({weatherResult}) {
    return(
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
        </div>
    );
}