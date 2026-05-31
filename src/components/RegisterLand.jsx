import { useState, useRef, useEffect } from "react";

export default function RegisterLand({ web3 }) {
  const { registerLand } = web3;
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);

  const [form, setForm] = useState({
    surveyNumber: "", location: "", area: "",
    landType: "Residential", latitude: "", longitude: "", documentHash: ""
  });
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [msg, setMsg] = useState("");

  // Initialize Leaflet map with matching dark mode layout
  useEffect(() => {
    if (leafletMap.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    
    // Using CartoDB Dark Matter tiles to blend natively with your dark theme dashboard
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap contributors © CARTO",
    }).addTo(map);

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
      if (markerRef.current) markerRef.current.setLatLng(e.latlng);
      else markerRef.current = L.marker(e.latlng).addTo(map).bindPopup("Selected parcel location").openPopup();
    });

    leafletMap.current = map;
  }, []);

  // Update marker when lat/lng fields are typed manually
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletMap.current) return;
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    const latlng = [lat, lng];
    if (markerRef.current) markerRef.current.setLatLng(latlng);
    else markerRef.current = L.marker(latlng).addTo(leafletMap.current);
    leafletMap.current.setView(latlng, 14);
  }, [form.latitude, form.longitude]);

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(f => ({
        ...f,
        latitude: pos.coords.latitude.toFixed(6),
        longitude: pos.coords.longitude.toFixed(6),
      }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading"); 
    setMsg("");
    
    try {
      // 🌟 THE CRITICAL SCALE FIX: Format the exact struct matching your Solidity LandInput types
      const processedForm = {
        surveyNumber: form.surveyNumber.trim(),
        location: form.location,
        area: BigInt(form.area), // Pass as BigInt to accommodate uint256 data types
        landType: form.landType,
        // Multiply by 10^6 to convert standard floating decimals into exact Solidity integers
        latitude: BigInt(Math.round(parseFloat(form.latitude) * 1000000)),  // e.g. 23.138276 -> 23138276
        longitude: BigInt(Math.round(parseFloat(form.longitude) * 1000000)), // e.g. 79.876661 -> 79876661
        documentHash: form.documentHash || "No Document Attached"
      };

      console.log("🚀 Submitting scaled payload structure to Web3 provider:", processedForm);

      // Execute the blockchain registration action 
      await registerLand(processedForm);
      
      setStatus("success");
      setMsg("Land registered successfully! Awaiting admin approval.");
      
      // Reset the frontend input form states completely
      setForm({ 
        surveyNumber: "", location: "", area: "", 
        landType: "Residential", latitude: "", longitude: "", documentHash: "" 
      });

      // Safely wipe out the selection pin from your map instance layout
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      
    } catch (err) {
      console.error("❌ Blockchain Execution Error Details:", err);
      setStatus("error");
      setMsg(err.reason || err.message || "Transaction failed");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Register Land</h1>
        <p>Submit a new land parcel for blockchain registration</p>
      </div>

      {status === "success" && <div className="alert success">✅ {msg}</div>}
      {status === "error" && <div className="alert error">❌ {msg}</div>}

      <div className="register-layout">
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-section-title">Parcel Details</div>

          <div className="form-row">
            <div className="form-group">
              <label>Survey / Plot Number *</label>
              <input required value={form.surveyNumber}
                onChange={e => setForm(f => ({ ...f, surveyNumber: e.target.value }))}
                placeholder="e.g. SY-123/4A" />
            </div>
            <div className="form-group">
              <label>Land Type *</label>
              <select value={form.landType} onChange={e => setForm(f => ({ ...f, landType: e.target.value }))}>
                {["Residential", "Agricultural", "Commercial", "Industrial", "Forest", "Government"].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Full Address / Location *</label>
            <input required value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Village, Tehsil, District, State" />
          </div>

          <div className="form-group">
            <label>Area (sq. metres) *</label>
            <input required type="number" min="1" value={form.area}
              onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
              placeholder="e.g. 500" />
          </div>

          <div className="form-section-title">GPS Coordinates
            <button type="button" className="gps-btn" onClick={useMyLocation}>📍 Use My Location</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude *</label>
              <input required value={form.latitude}
                onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                placeholder="e.g. 27.176700" />
            </div>
            <div className="form-group">
              <label>Longitude *</label>
              <input required value={form.longitude}
                onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                placeholder="e.g. 78.008000" />
            </div>
          </div>
          <p className="hint">💡 Click on the map to set coordinates automatically</p>

          <div className="form-group">
            <label>IPFS Document Hash (optional)</label>
            <input value={form.documentHash}
              onChange={e => setForm(f => ({ ...f, documentHash: e.target.value }))}
              placeholder="Qm... (upload docs to IPFS/Pinata first)" />
          </div>

          <button type="submit" className="submit-btn" disabled={status === "loading"}>
            {status === "loading" ? "⏳ Submitting to blockchain…" : "⛓ Register on Blockchain"}
          </button>
        </form>

        <div className="map-panel">
          <div className="map-label">📍 Click map to set parcel location</div>
          <div ref={mapRef} className="leaflet-map" style={{ minHeight: "450px" }} />
        </div>
      </div>
    </div>
  );
}
