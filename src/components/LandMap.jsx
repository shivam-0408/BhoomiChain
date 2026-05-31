import { useEffect, useRef, useState } from "react";
import { LAND_STATUS } from "../utils/contract";

export default function LandMap({ web3 }) {
  const { getAllLands } = web3;
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const [lands, setLands] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLands()
      .then(setLands)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || leafletMap.current) return;
    const L = window.L;
    if (!L) return;

    // Centered initially over general Indian subcontinent coordinates
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    
    // Smooth CartoDB Dark Matter tile layer matching Bhoomi-Chain theme
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap contributors © CARTO",
    }).addTo(map);

    const statusColors = { 0: "#f59e0b", 1: "#10b981", 2: "#ef4444", 3: "#6366f1" };

    // Array to temporarily hold processed map coordinates for automatic zoom fitting
    const mapBoundsArray = [];

    lands.forEach(land => {
      if (!land.latitude || !land.longitude) return;

      // 🛠️ FIX 1 & 2: Cast BigInt storage parameters to native JS Numbers and divide by 10^6
      const parsedLat = Number(land.latitude) / 1000000;
      const parsedLng = Number(land.longitude) / 1000000;

      // Add to bounds array for view mapping calculation later
      mapBoundsArray.push([parsedLat, parsedLng]);

      const color = statusColors[land.status] || "#888";

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:${color};border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      // Construct marker at recalculated GPS coordinates
      const marker = L.marker([parsedLat, parsedLng], { icon }).addTo(map);
      
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:200px">
          <strong>#${Number(land.id)} — ${land.surveyNumber}</strong><br/>
          <span style="font-size:12px;color:#555">${land.location}</span><br/><br/>
          <span>Type: ${land.landType}</span><br/>
          <span>Area: ${Number(land.area).toLocaleString()} m²</span><br/>
          <span>Status: <b style="color:${color}">${LAND_STATUS[land.status]?.label || 'Pending'}</b></span><br/>
          <span style="font-size:11px;color:#888">Owner: ${land.owner.slice(0, 10)}…</span>
        </div>
      `);
      
      marker.on("click", () => setSelected(land));
    });

    // 🛠️ FIX 3: Fit bounds dynamically to actual parsed positions
    if (mapBoundsArray.length > 0) {
      const bounds = L.latLngBounds(mapBoundsArray);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    leafletMap.current = map;
  }, [loading, lands]);

  return (
    <div className="page-container map-page">
      <div className="page-header">
        <h1>GPS Land Map</h1>
        <p>All {lands.length} registered parcels visualised on map</p>
      </div>

      <div className="map-legend">
        {Object.entries(LAND_STATUS).map(([k, v]) => (
          <span key={k} className="legend-item">
            <span className="legend-dot" style={{ background: v.color }} />
            {v.label}
          </span>
        ))}
      </div>

      <div className="map-layout">
        {loading
          ? <div className="loading-state">Loading parcels…</div>
          : <div ref={mapRef} className="leaflet-map full-map" style={{ height: "500px", width: "100%" }} />
        }

        {selected && (
          <div className="map-detail-panel">
            <button className="close-panel" onClick={() => setSelected(null)}>✕</button>
            <h3>#{Number(selected.id)} — {selected.surveyNumber}</h3>
            <div className="land-meta-row"><span>Location</span><span>{selected.location}</span></div>
            <div className="land-meta-row"><span>Type</span><span>{selected.landType}</span></div>
            <div className="land-meta-row"><span>Area</span><span>{Number(selected.area).toLocaleString()} m²</span></div>
            <div className="land-meta-row"><span>Status</span>
              <span className="status-badge"
                style={{ color: LAND_STATUS[selected.status]?.color, background: LAND_STATUS[selected.status]?.bg }}>
                {LAND_STATUS[selected.status]?.label}
              </span>
            </div>
            {/* Convert blockchain block timestamp to readable date string */}
            <div className="land-meta-row"><span>Registered</span><span>{new Date(Number(selected.registeredAt) * 1000).toLocaleDateString()}</span></div>
            <div className="land-meta-row"><span>Latitude</span><span className="mono">{(Number(selected.latitude) / 1000000).toFixed(6)}</span></div>
            <div className="land-meta-row"><span>Longitude</span><span className="mono">{(Number(selected.longitude) / 1000000).toFixed(6)}</span></div>
            <div className="land-meta-row"><span>Owner</span>
              <a href={`https://amoy.polygonscan.com/address/${selected.owner}`}
                target="_blank" rel="noreferrer" className="link mono">
                {selected.owner.slice(0, 10)}…{selected.owner.slice(-6)} ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}