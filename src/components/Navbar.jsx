export default function Navbar({ web3, activePage, setPage }) {
  const { account, isAdmin, isSuperAdmin, disconnect } = web3;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "register", label: "Register Land", icon: "＋" },
    { id: "mylands", label: "My Lands", icon: "◈" },
    { id: "alllands", label: "All Records", icon: "☰" },
    { id: "map", label: "GPS Map", icon: "◎" },
    ...(isAdmin ? [{ id: "admin", label: "Admin Panel", icon: "⚙" }] : []),
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setPage("dashboard")}>
        <span className="brand-icon">⛓</span>
        <span className="brand-name">BhoomiChain</span>
      </div>

      <div className="nav-links">
        {account && navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${activePage === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="nav-wallet">
        {account && (
          <>
            <div className="wallet-info">
              <span className="wallet-badge">
                {isSuperAdmin ? "⭐ Super Admin" : isAdmin ? "🛡 Admin" : "👤 User"}
              </span>
              <span className="wallet-addr">
                {account.slice(0, 6)}…{account.slice(-4)}
              </span>
            </div>
            <button className="disconnect-btn" onClick={disconnect}>✕</button>
          </>
        )}
      </div>
    </nav>
  );
}
