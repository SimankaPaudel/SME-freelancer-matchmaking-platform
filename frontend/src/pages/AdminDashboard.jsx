import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDashboard.css";

const API = "http://localhost:5000/api/admin";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}` });

// ── Small reusable stat card ──────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="ad-stat-card" style={{ borderTopColor: color }}>
      <p className="ad-stat-value">{value}</p>
      <p className="ad-stat-label">{label}</p>
      {sub && <p className="ad-stat-sub">{sub}</p>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate  = useNavigate();
  const [tab, setTab] = useState("analytics");

  // Guard — must be Admin
  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken");
      const { role } = JSON.parse(atob(token.split(".")[1]));
      if (role !== "Admin") navigate("/dashboard");
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const tabs = [
    { id: "analytics", label: "📊 Analytics" },
    { id: "users",     label: "👥 Users" },
    { id: "projects",  label: "📁 Projects" },
    { id: "disputes",  label: "⚠️ Disputes" },
  ];

  return (
    <div className="ad-page">
      <div className="ad-header">
        <h1>Admin Dashboard</h1>
        <p>TaskHive platform management</p>
      </div>

      {/* Tab bar */}
      <div className="ad-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`ad-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="ad-body">
        {tab === "analytics" && <AnalyticsPanel />}
        {tab === "users"     && <UsersPanel />}
        {tab === "projects"  && <ProjectsPanel />}
        {tab === "disputes"  && <DisputesPanel />}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// ANALYTICS PANEL
// ═════════════════════════════════════════════════════════
function AnalyticsPanel() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/analytics`, { headers: headers() })
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data)   return <p className="ad-error">Failed to load analytics.</p>;

  const { users, projects, payments, monthlyData, topFreelancers, topSMEs } = data;
  const maxVol = Math.max(...monthlyData.map((m) => m.volume), 1);

  return (
    <div className="ad-analytics">
      {/* ── Summary stats ── */}
      <section>
        <h2 className="ad-section-title">Overview</h2>
        <div className="ad-stats-grid">
          <StatCard label="Total Users"       value={users.total}        color="#b08968" />
          <StatCard label="Freelancers"        value={users.freelancers}  color="#4a9b6f" />
          <StatCard label="SMEs"               value={users.smes}         color="#6b4f3f" />
          <StatCard label="Pending KYC"        value={users.pendingKYC}   color="#d4a017" sub="awaiting review" />
          <StatCard label="Total Projects"     value={projects.total}     color="#b08968" />
          <StatCard label="Active Projects"    value={projects.active}    color="#4a9b6f" />
          <StatCard label="Completed Projects" value={projects.completed} color="#6b4f3f" />
          <StatCard label="Total Payments"     value={`₹${payments.total.toLocaleString()}`} color="#b08968" sub={`${payments.escrows} escrows`} />
          <StatCard label="Disputes"           value={payments.disputed}  color="#c0392b" sub="active disputes" />
        </div>
      </section>

      {/* ── Monthly bar chart ── */}
      <section>
        <h2 className="ad-section-title">Monthly Transaction Volume</h2>
        <div className="ad-bar-chart">
          {monthlyData.map((m) => (
            <div key={m.month} className="ad-bar-col">
              <span className="ad-bar-amount">₹{m.volume.toLocaleString()}</span>
              <div
                className="ad-bar"
                style={{ height: `${Math.max((m.volume / maxVol) * 180, 4)}px` }}
              />
              <span className="ad-bar-label">{m.month}</span>
              <span className="ad-bar-count">{m.count} tx</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Top freelancers ── */}
      <section>
        <h2 className="ad-section-title">Top Performing Freelancers</h2>
        <table className="ad-table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Email</th><th>Jobs Done</th><th>Total Earned</th>
            </tr>
          </thead>
          <tbody>
            {topFreelancers.length === 0 && (
              <tr><td colSpan={5} className="ad-empty">No data yet</td></tr>
            )}
            {topFreelancers.map((f, i) => (
              <tr key={f._id}>
                <td>{i + 1}</td>
                <td>{f.fullName}</td>
                <td>{f.email}</td>
                <td><strong>{f.completedJobs}</strong></td>
                <td>₹{f.totalEarned.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Most active SMEs ── */}
      <section>
        <h2 className="ad-section-title">Most Active SMEs</h2>
        <table className="ad-table">
          <thead>
            <tr><th>#</th><th>Name</th><th>Email</th><th>Projects Posted</th></tr>
          </thead>
          <tbody>
            {topSMEs.length === 0 && (
              <tr><td colSpan={4} className="ad-empty">No data yet</td></tr>
            )}
            {topSMEs.map((s, i) => (
              <tr key={s._id}>
                <td>{i + 1}</td>
                <td>{s.fullName}</td>
                <td>{s.email}</td>
                <td><strong>{s.projectCount}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// USERS PANEL
// ═════════════════════════════════════════════════════════
function UsersPanel() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("");
  const [kyc,     setKyc]     = useState("");
  const [page,    setPage]    = useState(1);
  const [kycModal, setKycModal] = useState(null); // { user, action }
  const [kycNote,  setKycNote]  = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/users`, {
        headers: headers(),
        params: { search, role, kycStatus: kyc, page, limit: 15 },
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, role, kyc, page]);

  const toggleActive = async (id) => {
    try {
      await axios.patch(`${API}/users/${id}/toggle-active`, {}, { headers: headers() });
      fetchUsers();
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  const submitKYC = async () => {
    try {
      await axios.patch(
        `${API}/users/${kycModal.user._id}/kyc`,
        { status: kycModal.action, note: kycNote },
        { headers: headers() }
      );
      setKycModal(null);
      setKycNote("");
      fetchUsers();
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  const kycBadge = (s) => {
    const map = { Approved: "ad-badge-green", Rejected: "ad-badge-red", Pending: "ad-badge-amber" };
    return <span className={`ad-badge ${map[s] || "ad-badge-muted"}`}>{s}</span>;
  };

  return (
    <div>
      {/* Filters */}
      <div className="ad-filters">
        <input
          className="ad-search"
          placeholder="🔍 Search name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="ad-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="Freelancer">Freelancer</option>
          <option value="SME">SME</option>
        </select>
        {role !== "Freelancer" && (
          <select className="ad-select" value={kyc} onChange={(e) => { setKyc(e.target.value); setPage(1); }}>
            <option value="">All KYC</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        )}
        <span className="ad-total">{total} users</span>
      </div>

      {loading ? <Loader /> : (
        <table className="ad-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th>
              <th>KYC</th><th>KYC Doc</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={7} className="ad-empty">No users found</td></tr>}
            {users.map((u) => (
              <tr key={u._id} className={u.isActive === false ? "ad-row-inactive" : ""}>
                <td><strong>{u.fullName}</strong></td>
                <td>{u.email}</td>
                <td><span className={`ad-badge ${u.role === "SME" ? "ad-badge-blue" : "ad-badge-brown"}`}>{u.role}</span></td>
                <td>{u.role === "SME" ? kycBadge(u.kycStatus) : <span className="ad-muted">N/A</span>}</td>
                <td>
                  {u.role === "SME" && u.kycDocument
                    ? <a href={`http://localhost:5000/${u.kycDocument}`} target="_blank" rel="noreferrer" className="ad-link">📄 View</a>
                    : <span className="ad-muted">None</span>}
                </td>
                <td>
                  <span className={`ad-badge ${u.isActive === false ? "ad-badge-red" : "ad-badge-green"}`}>
                    {u.isActive === false ? "Inactive" : "Active"}
                  </span>
                </td>
                <td className="ad-action-cell">
                  {/* Toggle active */}
                  <button
                    className={`ad-btn-sm ${u.isActive === false ? "success" : "danger"}`}
                    onClick={() => toggleActive(u._id)}
                  >
                    {u.isActive === false ? "Activate" : "Deactivate"}
                  </button>

                  {/* KYC actions — only for SME with doc uploaded and pending */}
                  {u.role === "SME" && u.kycDocument && u.kycStatus === "Pending" && (
                    <>
                      <button
                        className="ad-btn-sm success"
                        onClick={() => setKycModal({ user: u, action: "Approved" })}
                      >
                        ✓ Approve KYC
                      </button>
                      <button
                        className="ad-btn-sm danger"
                        onClick={() => setKycModal({ user: u, action: "Rejected" })}
                      >
                        ✗ Reject KYC
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="ad-pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="ad-page-btn">← Prev</button>
        <span>Page {page}</span>
        <button disabled={users.length < 15} onClick={() => setPage(page + 1)} className="ad-page-btn">Next →</button>
      </div>

      {/* KYC modal */}
      {kycModal && (
        <div className="ad-modal-overlay" onClick={() => setKycModal(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{kycModal.action === "Approved" ? "✓ Approve KYC" : "✗ Reject KYC"}</h3>
            <p>User: <strong>{kycModal.user.fullName}</strong></p>
            {kycModal.user.kycDocument && (
              <a
                href={`http://localhost:5000/${kycModal.user.kycDocument}`}
                target="_blank" rel="noreferrer"
                className="ad-link"
                style={{ display: "block", marginBottom: 12 }}
              >
                📄 Open KYC Document
              </a>
            )}
            <textarea
              className="ad-modal-textarea"
              placeholder={kycModal.action === "Rejected" ? "Reason for rejection (optional)" : "Note (optional)"}
              value={kycNote}
              onChange={(e) => setKycNote(e.target.value)}
              rows={3}
            />
            <div className="ad-modal-actions">
              <button
                className={`ad-btn ${kycModal.action === "Approved" ? "success" : "danger"}`}
                onClick={submitKYC}
              >
                Confirm {kycModal.action}
              </button>
              <button className="ad-btn outline" onClick={() => setKycModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// PROJECTS PANEL
// ═════════════════════════════════════════════════════════
function ProjectsPanel() {
  const [projects, setProjects] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/projects`, {
      headers: headers(),
      params: { search, status, page, limit: 15 },
    })
      .then(({ data }) => { setProjects(data.projects); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, status, page]);

  const statusBadge = (s) => {
    const map = { Open: "ad-badge-green", Closed: "ad-badge-red", "In Progress": "ad-badge-blue" };
    return <span className={`ad-badge ${map[s] || "ad-badge-muted"}`}>{s}</span>;
  };

  return (
    <div>
      <div className="ad-filters">
        <input
          className="ad-search"
          placeholder="🔍 Search project title..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="ad-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="In Progress">In Progress</option>
        </select>
        <span className="ad-total">{total} projects</span>
      </div>

      {loading ? <Loader /> : (
        <table className="ad-table">
          <thead>
            <tr>
              <th>Title</th><th>Posted By</th><th>Budget</th><th>Status</th><th>Deadline</th><th>Posted</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && <tr><td colSpan={6} className="ad-empty">No projects found</td></tr>}
            {projects.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.title}</strong></td>
                <td>
                  <span>{p.postedBy?.fullName || "N/A"}</span>
                  <br />
                  <span className="ad-muted">{p.postedBy?.email}</span>
                </td>
                <td>₹{p.budgetMin?.toLocaleString()} – ₹{p.budgetMax?.toLocaleString()}</td>
                <td>{statusBadge(p.status)}</td>
                <td>{p.deadline ? new Date(p.deadline).toLocaleDateString() : "—"}</td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="ad-pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="ad-page-btn">← Prev</button>
        <span>Page {page}</span>
        <button disabled={projects.length < 15} onClick={() => setPage(page + 1)} className="ad-page-btn">Next →</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// DISPUTES PANEL
// ═════════════════════════════════════════════════════════
function DisputesPanel() {
  const [disputes, setDisputes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // { escrow }
  const [resolution, setResolution] = useState("release");
  const [note,       setNote]       = useState("");

  const fetchDisputes = () => {
    setLoading(true);
    axios.get(`${API}/disputes`, { headers: headers() })
      .then(({ data }) => setDisputes(data.disputes))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDisputes(); }, []);

  const resolve = async () => {
    try {
      await axios.patch(
        `${API}/disputes/${modal._id}/resolve`,
        { resolution, note },
        { headers: headers() }
      );
      setModal(null);
      setNote("");
      fetchDisputes();
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  return (
    <div>
      <div className="ad-filters">
        <span className="ad-total">{disputes.length} active disputes</span>
      </div>

      {loading ? <Loader /> : disputes.length === 0 ? (
        <div className="ad-empty-box">✅ No active disputes. Everything looks good!</div>
      ) : (
        <table className="ad-table">
          <thead>
            <tr>
              <th>Project</th><th>Freelancer</th><th>SME</th>
              <th>Amount</th><th>Dispute Reason</th><th>Raised</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d._id}>
                <td><strong>{d.projectId?.title || "N/A"}</strong></td>
                <td>
                  {d.freelancerId?.fullName}<br />
                  <span className="ad-muted">{d.freelancerId?.email}</span>
                </td>
                <td>
                  {d.smeId?.fullName}<br />
                  <span className="ad-muted">{d.smeId?.email}</span>
                </td>
                <td>₹{d.amount?.toLocaleString()}</td>
                <td className="ad-dispute-reason">{d.disputeReason || "—"}</td>
                <td>{new Date(d.updatedAt).toLocaleDateString()}</td>
                <td>
                  <button className="ad-btn-sm primary" onClick={() => setModal(d)}>
                    🛠 Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Resolve modal */}
      {modal && (
        <div className="ad-modal-overlay" onClick={() => setModal(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🛠 Resolve Dispute</h3>
            <p><strong>Project:</strong> {modal.projectId?.title}</p>
            <p><strong>Amount:</strong> ₹{modal.amount?.toLocaleString()}</p>
            <p><strong>Reason:</strong> {modal.disputeReason || "Not specified"}</p>

            <div className="ad-radio-group">
              <label className={`ad-radio-option ${resolution === "release" ? "selected" : ""}`}>
                <input type="radio" value="release" checked={resolution === "release"} onChange={() => setResolution("release")} />
                💸 Release payment to Freelancer
              </label>
              <label className={`ad-radio-option ${resolution === "refund" ? "selected" : ""}`}>
                <input type="radio" value="refund" checked={resolution === "refund"} onChange={() => setResolution("refund")} />
                🔄 Refund payment to SME
              </label>
            </div>

            <textarea
              className="ad-modal-textarea"
              placeholder="Resolution note (required)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />

            <div className="ad-modal-actions">
              <button className="ad-btn primary" onClick={resolve} disabled={!note.trim()}>
                Confirm Resolution
              </button>
              <button className="ad-btn outline" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Loader ────────────────────────────────────────────────
function Loader() {
  return (
    <div className="ad-loader">
      <div className="ad-spinner" />
      <p>Loading...</p>
    </div>
  );
}

