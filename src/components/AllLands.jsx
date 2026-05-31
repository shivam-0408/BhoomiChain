import { useEffect, useState } from "react";
import { LAND_STATUS } from "../utils/contract";

export default function AllLands({ web3 }) {
  const { getAllLands } = web3;
  const [lands, setLands] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    getAllLands()
      .then(data => { setLands(data); setFiltered(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let res = lands;
    if (search) res = res.filter(l =>
      l.surveyNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase()) ||
      l.owner.toLowerCase().includes(search.toLowerCase())
    );
    if (filterStatus !== "all") res = res.filter(l => l.status === parseInt(filterStatus));
    if (filterType !== "all") res = res.filter(l => l.landType === filterType);
    setFiltered(res);
  }, [search, filterStatus, filterType, lands]);

  const types = [...new Set(lands.map(l => l.landType))];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>All Land Records</h1>
        <p>Public blockchain registry — {lands.length} total parcels</p>
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="Search survey no., location, owner…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="0">Pending</option>
          <option value="1">Approved</option>
          <option value="2">Rejected</option>
          <option value="3">Transfer Pending</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <div className="loading-state">Loading records from blockchain…</div> :
        filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">📭</div><p>No records found.</p></div> : (
          <div className="table-wrapper">
            <table className="land-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Survey No.</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Area (m²)</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(land => {
                  const st = LAND_STATUS[land.status];
                  return (
                    <tr key={land.id}>
                      <td className="id-col">#{land.id}</td>
                      <td className="survey-col">{land.surveyNumber}</td>
                      <td>{land.location}</td>
                      <td><span className="type-tag">{land.landType}</span></td>
                      <td>{land.area.toLocaleString()}</td>
                      <td className="mono addr-col">
                        <a href={`https://amoy.polygonscan.com/address/${land.owner}`}
                          target="_blank" rel="noreferrer" className="link">
                          {land.owner.slice(0, 6)}…{land.owner.slice(-4)}
                        </a>
                      </td>
                      <td><span className="status-badge" style={{ color: st.color, background: st.bg }}>{st.label}</span></td>
                      <td>{land.registeredAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
