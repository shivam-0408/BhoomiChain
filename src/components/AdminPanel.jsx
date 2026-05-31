import { useEffect, useState } from "react";
import { LAND_STATUS } from "../utils/contract";

export default function AdminPanel({ web3 }) {
  const { getAllLands, approveLand, rejectLand, approveTransfer, rejectTransfer, addAdmin, isAdmin, isSuperAdmin, account } = web3;
  const [lands, setLands] = useState([]);
  const [pendingLands, setPendingLands] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [newAdminAddr, setNewAdminAddr] = useState("");
  const [adminMsg, setAdminMsg] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const load = async () => {
    setLoading(true);
    try {
      const all = await getAllLands();
      setLands(all);
      setPendingLands(all.filter(l => l.status === 0));
      setPendingTransfers(all.filter(l => l.status === 3));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id, isTransfer = false) => {
    setProcessing(p => ({ ...p, [id]: "approving" }));
    try {
      if (isTransfer) await approveTransfer(id);
      else await approveLand(id);
      await load();
    } catch (e) { alert(e.reason || e.message); }
    finally { setProcessing(p => ({ ...p, [id]: null })); }
  };

  const handleReject = async () => {
    const { id, isTransfer } = rejectModal;
    setProcessing(p => ({ ...p, [id]: "rejecting" }));
    try {
      if (isTransfer) await rejectTransfer(id, rejectReason);
      else await rejectLand(id, rejectReason);
      setRejectModal(null); setRejectReason("");
      await load();
    } catch (e) { alert(e.reason || e.message); }
    finally { setProcessing(p => ({ ...p, [id]: null })); }
  };

  const handleAddAdmin = async () => {
    try {
      await addAdmin(newAdminAddr);
      setAdminMsg({ type: "success", text: `${newAdminAddr.slice(0, 10)}… added as admin` });
      setNewAdminAddr("");
    } catch (e) {
      setAdminMsg({ type: "error", text: e.reason || e.message });
    }
  };

  const tabs = [
    { id: "pending", label: `Pending Registration (${pendingLands.length})` },
    { id: "transfers", label: `Pending Transfers (${pendingTransfers.length})` },
    ...(isSuperAdmin ? [{ id: "admins", label: "Manage Admins" }] : []),
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>{isSuperAdmin ? "⭐ Super Administrator" : "🛡 Administrator"} — {account?.slice(0, 10)}…</p>
      </div>

      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {loading ? <div className="loading-state">Loading pending items…</div> : (
        <>
          {activeTab === "pending" && (
            <div>
              {pendingLands.length === 0
                ? <div className="empty-state"><div className="empty-icon">✅</div><p>No pending registrations.</p></div>
                : pendingLands.map(land => (
                  <ApprovalCard key={land.id} land={land} type="registration"
                    processing={processing[land.id]}
                    onApprove={() => handleApprove(land.id)}
                    onReject={() => setRejectModal({ id: land.id, isTransfer: false })} />
                ))}
            </div>
          )}

          {activeTab === "transfers" && (
            <div>
              {pendingTransfers.length === 0
                ? <div className="empty-state"><div className="empty-icon">✅</div><p>No pending transfers.</p></div>
                : pendingTransfers.map(land => (
                  <ApprovalCard key={land.id} land={land} type="transfer"
                    processing={processing[land.id]}
                    onApprove={() => handleApprove(land.id, true)}
                    onReject={() => setRejectModal({ id: land.id, isTransfer: true })} />
                ))}
            </div>
          )}

          {activeTab === "admins" && isSuperAdmin && (
            <div className="admin-section">
              <h3>Add New Admin</h3>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Wallet Address</label>
                  <input value={newAdminAddr} onChange={e => setNewAdminAddr(e.target.value)}
                    placeholder="0x..." />
                </div>
                <button className="btn-primary" style={{ alignSelf: "flex-end" }} onClick={handleAddAdmin}>
                  Add Admin
                </button>
              </div>
              {adminMsg && <div className={`alert ${adminMsg.type}`}>{adminMsg.text}</div>}
              <div className="info-card">
                <p>ℹ️ Only the super admin (contract deployer) can add or remove admins. Admins can approve/reject land registrations and ownership transfers.</p>
              </div>
            </div>
          )}
        </>
      )}

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Reject {rejectModal.isTransfer ? "Transfer" : "Registration"}</h3>
            <div className="form-group">
              <label>Reason for rejection *</label>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Documents insufficient, survey number mismatch…" />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleReject} disabled={!rejectReason}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalCard({ land, type, processing, onApprove, onReject }) {
  return (
    <div className="approval-card">
      <div className="approval-header">
        <div>
          <span className="survey-number">#{land.id} — {land.surveyNumber}</span>
          <div className="land-location">📍 {land.location}</div>
        </div>
        <span className="type-tag">{land.landType}</span>
      </div>
      <div className="approval-body">
        <div className="land-meta-row"><span>Area</span><span>{land.area.toLocaleString()} m²</span></div>
        <div className="land-meta-row"><span>Submitted</span><span>{land.registeredAt}</span></div>
        <div className="land-meta-row"><span>Coordinates</span>
          <span className="mono">{land.latitude.toFixed(5)}, {land.longitude.toFixed(5)}</span>
        </div>
        <div className="land-meta-row"><span>{type === "transfer" ? "Current Owner" : "Owner"}</span>
          <span className="mono">{land.owner.slice(0, 10)}…{land.owner.slice(-6)}</span>
        </div>
        {type === "transfer" && land.pendingOwner !== "0x0000000000000000000000000000000000000000" && (
          <div className="land-meta-row"><span>Pending New Owner</span>
            <span className="mono">{land.pendingOwner.slice(0, 10)}…{land.pendingOwner.slice(-6)}</span>
          </div>
        )}
      </div>
      <div className="approval-actions">
        <button className="btn-danger" onClick={onReject} disabled={!!processing}>Reject</button>
        <button className="btn-success" onClick={onApprove} disabled={!!processing}>
          {processing === "approving" ? "⏳ Approving…" : "✅ Approve"}
        </button>
      </div>
    </div>
  );
}
