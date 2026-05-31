import { useEffect, useState } from "react";

export default function Dashboard({ web3, setPage }) {
  const { account, isAdmin, isSuperAdmin, getAllLands, getOwnerLands } = web3;
  const [stats, setStats] = useState({ total: 0, mine: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [all, mine] = await Promise.all([getAllLands(), getOwnerLands(account)]);
        setStats({
          total: all.length,
          mine: mine.length,
          pending: all.filter(l => l.status === 0).length,
          approved: all.filter(l => l.status === 1).length,
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [account]);

  const cards = [
    { label: "Total Parcels", value: stats.total, icon: "🏘", page: "alllands", color: "#6366f1" },
    { label: "My Properties", value: stats.mine, icon: "🏠", page: "mylands", color: "#10b981" },
    { label: "Pending Approval", value: stats.pending, icon: "⏳", page: "admin", color: "#f59e0b" },
    { label: "Approved Lands", value: stats.approved, icon: "✅", page: "alllands", color: "#3b82f6" },
  ];

  const actions = [
    { label: "Register New Land", icon: "＋", page: "register", desc: "Submit a new property for registration" },
    { label: "View on Map", icon: "◎", page: "map", desc: "See all registered parcels on GPS map" },
    { label: "My Lands", icon: "◈", page: "mylands", desc: "Manage your registered properties" },
    ...(isAdmin ? [{ label: "Admin Panel", icon: "⚙", page: "admin", desc: "Approve registrations & transfers" }] : []),
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome back</h1>
        <p className="wallet-display">{account}</p>
        {isSuperAdmin && <span className="role-tag super">Super Administrator</span>}
        {!isSuperAdmin && isAdmin && <span className="role-tag admin">Administrator</span>}
      </div>

      {loading ? (
        <div className="loading-state">Loading blockchain data…</div>
      ) : (
        <>
          <div className="stats-grid">
            {cards.map(c => (
              <div key={c.label} className="stat-card" onClick={() => setPage(c.page)} style={{ "--accent": c.color }}>
                <span className="stat-icon">{c.icon}</span>
                <span className="stat-value">{c.value}</span>
                <span className="stat-label">{c.label}</span>
              </div>
            ))}
          </div>

          <div className="section-title">Quick Actions</div>
          <div className="actions-grid">
            {actions.map(a => (
              <div key={a.label} className="action-card" onClick={() => setPage(a.page)}>
                <span className="action-icon">{a.icon}</span>
                <div>
                  <div className="action-label">{a.label}</div>
                  <div className="action-desc">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-title">Network Info</div>
          <div className="network-card">
            <div className="network-row"><span>Network</span><span className="tag green">Polygon Amoy Testnet</span></div>
            <div className="network-row"><span>Chain ID</span><span>80002</span></div>
            <div className="network-row"><span>Connected Wallet</span><span className="mono">{account.slice(0, 10)}…{account.slice(-6)}</span></div>
            <div className="network-row"><span>Explorer</span>
              <a href={`https://amoy.polygonscan.com/address/${account}`} target="_blank" rel="noreferrer" className="link">View on Polygonscan ↗</a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
