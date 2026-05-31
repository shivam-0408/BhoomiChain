import { useEffect, useState } from "react";
import { LAND_STATUS } from "../utils/contract";

export default function MyLands({ web3 }) {
  const { account, getOwnerLands, requestTransfer } = web3;
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferModal, setTransferModal] = useState(null);
  const [newOwner, setNewOwner] = useState("");
  const [txStatus, setTxStatus] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getOwnerLands(account);
      setLands(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [account]);

  const handleTransfer = async () => {
    setTxStatus("loading");
    try {
      await requestTransfer(transferModal.id, newOwner);
      setTxStatus("success");
      setTimeout(() => { setTransferModal(null); setNewOwner(""); setTxStatus(null); load(); }, 2000);
    } catch (e) {
      setTxStatus("error:" + (e.reason || e.message));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Land Records</h1>
        <p>{lands.length} registered parcel{lands.length !== 1 ? "s" : ""}</p>
      </div>

      {loading ? <div className="loading-state">Fetching from blockchain…</div> :
        lands.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏜</div>
            <p>No land parcels registered under your address.</p>
          </div>
        ) : (
          <div className="lands-grid">
            {lands.map(land => (
              <LandCard key={land.id} land={land} onTransfer={setTransferModal} />
            ))}
          </div>
        )}

      {transferModal && (
        <div className="modal-overlay" onClick={() => setTransferModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Transfer Ownership</h3>
            <p className="modal-sub">Land #{transferModal.id} — {transferModal.surveyNumber}</p>
            <div className="form-group">
              <label>New Owner Address *</label>
              <input value={newOwner} onChange={e => setNewOwner(e.target.value)}
                placeholder="0x..." />
            </div>
            {txStatus === "loading" && <div className="alert info">⏳ Submitting transfer request…</div>}
            {txStatus === "success" && <div className="alert success">✅ Transfer request submitted! Awaiting admin approval.</div>}
            {txStatus?.startsWith("error") && <div className="alert error">❌ {txStatus.slice(6)}</div>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setTransferModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleTransfer} disabled={txStatus === "loading" || !newOwner}>
                Request Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LandCard({ land, onTransfer }) {
  const st = LAND_STATUS[land.status];
  return (
    <div className="land-card">
      <div className="land-card-header">
        <div>
          <div className="survey-number">{land.surveyNumber}</div>
          <div className="land-location">📍 {land.location}</div>
        </div>
        <span className="status-badge" style={{ color: st.color, background: st.bg }}>{st.label}</span>
      </div>
      <div className="land-card-body">
        <div className="land-meta-row"><span>Type</span><span>{land.landType}</span></div>
        <div className="land-meta-row"><span>Area</span><span>{land.area.toLocaleString()} m²</span></div>
        <div className="land-meta-row"><span>Registered</span><span>{land.registeredAt}</span></div>
        <div className="land-meta-row"><span>Coordinates</span>
          <span className="mono">{land.latitude.toFixed(4)}, {land.longitude.toFixed(4)}</span>
        </div>
      </div>
      <div className="land-card-footer">
        <a className="link-sm" href={`https://amoy.polygonscan.com/address/${land.owner}`} target="_blank" rel="noreferrer">
          View owner ↗
        </a>
        {land.status === 1 && (
          <button className="btn-sm-primary" onClick={() => onTransfer(land)}>Transfer Ownership</button>
        )}
        {land.status === 3 && (
          <span className="tag orange">Transfer Pending Admin Approval</span>
        )}
      </div>
    </div>
  );
}
