import { useState } from "react";
import { useWeb3 } from "./hooks/useWeb3";
import Dashboard from "./components/Dashboard";
import RegisterLand from "./components/RegisterLand";
import MyLands from "./components/MyLands";
import AllLands from "./components/AllLands";
import AdminPanel from "./components/AdminPanel";
import LandMap from "./components/LandMap";
import Navbar from "./components/Navbar";
import "./App.css";

export default function App() {
  const web3 = useWeb3();
  const [activePage, setActivePage] = useState("dashboard");

  const pages = {
    dashboard: <Dashboard web3={web3} setPage={setActivePage} />,
    register: <RegisterLand web3={web3} />,
    mylands: <MyLands web3={web3} />,
    alllands: <AllLands web3={web3} />,
    map: <LandMap web3={web3} />,
    admin: <AdminPanel web3={web3} />,
  };

  return (
    <div className="app">
      <Navbar web3={web3} activePage={activePage} setPage={setActivePage} />
      <main className="main-content">
        {!web3.account ? (
          <div className="connect-screen">
            <div className="connect-card">
              <div className="connect-icon">⛓️</div>
              <h1>BhoomiChain</h1>
              <p className="connect-subtitle">
                Decentralised Land Registry on Polygon Amoy
              </p>
              <div className="features-grid">
                {["🏛️ Tamper-proof records", "🔏 Cryptographic ownership", "🗺️ GPS-mapped parcels", "✅ Government approval workflow"].map(f => (
                  <div key={f} className="feature-chip">{f}</div>
                ))}
              </div>
              {web3.error && <div className="error-banner">{web3.error}</div>}
              <button className="connect-btn" onClick={web3.connect} disabled={web3.loading}>
                {web3.loading ? "Connecting…" : "Connect MetaMask"}
              </button>
              <p className="network-note">Requires Polygon Amoy Testnet (Chain ID: 80002)</p>
            </div>
          </div>
        ) : !web3.isCorrectNetwork ? (
          <div className="connect-screen">
            <div className="connect-card">
              <div className="connect-icon">⚠️</div>
              <h2>Wrong Network</h2>
              <p>Please switch to Polygon Amoy Testnet</p>
              <button className="connect-btn" onClick={web3.switchToAmoy}>Switch Network</button>
            </div>
          </div>
        ) : (
          pages[activePage] || pages.dashboard
        )}
      </main>
    </div>
  );
}
