// Request.jsx

import { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { getMyJoinRequests, handleJoinRequest } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import "./Requests.css";

function Requests() {
  const { user, token, logout } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("pending"); // pending | approved | rejected | all
  const [searchTerm, setSearchTerm] = useState("");

  // Load all join requests across owned projects
  useEffect(() => {
    getMyJoinRequests(token)
      .then((response) => {
        setRequests(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [token]);

  const handleRequestAction = (projectId, requestId, action) => {
    handleJoinRequest(projectId, requestId, action, token)
      .then(() => {
        setRequests(prev =>
          prev.map(req =>
            req._id === requestId ? { ...req, status: action === "approve" ? "approved" : "rejected" } : req
          )
        );
      })
      .catch(err => console.error(err));
  };

  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

  if (loading) return <div>Loading...</div>;

  // Derived filtered groups
  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  const filteredList =
    activeFilter === "pending" ? pendingRequests :
    activeFilter === "approved" ? approvedRequests :
    activeFilter === "rejected" ? rejectedRequests :
    requests;

  const searchedList = filteredList.filter(req =>
    req.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.project_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Top projects by total request count
  const projectCounts = {};
  requests.forEach(req => {
    projectCounts[req.project_title] = (projectCounts[req.project_title] || 0) + 1;
  });
  const topProjects = Object.entries(projectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Donut chart values for Request Overview
  const total = requests.length || 1; // avoid divide-by-zero
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const overviewSegments = [
    { label: "Pending", value: pendingRequests.length, color: "#f59e0b" },
    { label: "Approved", value: approvedRequests.length, color: "#10B981" },
    { label: "Rejected", value: rejectedRequests.length, color: "#ef4444" },
  ].filter(seg => seg.value > 0);

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
      <Sidebar activePage="requests" />
      <div className="requests-container">

        {/* navbar */}
        <div className="requests-nav">
          <div className="search-bar">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search projects, skills, technologies..." />
          </div>
          <div className="nav-right">
            <button className="theme-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="M4.93 4.93l1.41 1.41" />
                <path d="M17.66 17.66l1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="M6.34 17.66l-1.41 1.41" />
                <path d="M19.07 4.93l-1.41 1.41" />
              </svg>
            </button>
            <button className="notifications">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="profile-section" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="profile-pic">{user?.avatar
                    ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    : firstLetter}</div>
              <span>{ user?.name ||user?.username || "User"}</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {showProfileMenu && (
                <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                  <a href="/profile">My Profile</a>
                  <a href="/settings">Settings</a>
                  <button className="logout-btn" onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="requests-content">

          {/* Center column */}
          <div className="requests-center">

            <div className="requests-header">
              <h1 className="requests-title">Requests</h1>
              <p className="requests-subtitle">Manage all contributor requests across your projects.</p>
            </div>

            {/* Stat cards */}
            <div className="requests-stats-div">
              <div className="req-stat-card-1">
                <div className="req-stat-icon-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <div className="req-stat-info">
                  <span className="req-stat-number">{requests.length}</span>
                  <span className="req-stat-label">Total Requests</span>
                  <span className="req-stat-sublabel">Across all projects</span>
                </div>
              </div>

              <div className="req-stat-card-2">
                <div className="req-stat-icon-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="req-stat-info">
                  <span className="req-stat-number">{pendingRequests.length}</span>
                  <span className="req-stat-label">Pending Review</span>
                  <span className="req-stat-sublabel">Awaiting your action</span>
                </div>
              </div>

              <div className="req-stat-card-3">
                <div className="req-stat-icon-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="req-stat-info">
                  <span className="req-stat-number">{approvedRequests.length}</span>
                  <span className="req-stat-label">Approved</span>
                  <span className="req-stat-sublabel">This month</span>
                </div>
              </div>

              <div className="req-stat-card-4">
                <div className="req-stat-icon-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <div className="req-stat-info">
                  <span className="req-stat-number">{rejectedRequests.length}</span>
                  <span className="req-stat-label">Rejected</span>
                  <span className="req-stat-sublabel">This month</span>
                </div>
              </div>
            </div>

            {/* Search + filter row */}
            <div className="requests-toolbar">
              <div className="requests-search-bar">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select className="filter-select" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Projects</option>
              </select>
            </div>

            {/* Requests list */}
            <div className="requests-list-section">
              <div className="requests-list-header">
                <span className="requests-list-title">
                  {activeFilter === "pending" ? "Pending Requests" :
                   activeFilter === "approved" ? "Approved Requests" :
                   activeFilter === "rejected" ? "Rejected Requests" : "All Requests"}
                  {" "}
                  <span className="requests-list-count">{searchedList.length}</span>
                </span>
              </div>

              {searchedList.length === 0 && (
                <div className="requests-empty-state">No requests found.</div>
              )}

              {searchedList.map(req => (
                <div key={req._id} className="request-card">
                  <div className="request-card-left">
                    <div className="request-avatar">{req.username?.charAt(0).toUpperCase()}</div>
                    <div className="request-card-info">
                      <span className="request-card-name">{req.username}</span>
                      <span className="request-card-time">
                        Requested {new Date(req.requested_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="request-card-project">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="request-card-project-title">{req.project_title}</span>
                    <div className="request-card-skills">
                      {req.required_skills?.map(skill => (
                        <span key={skill} className="request-skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="request-card-right">
                    {req.status === "pending" ? (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() => handleRequestAction(req.project_id, req._id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleRequestAction(req.project_id, req._id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={`status-badge status-badge--${req.status}`}>
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right column */}
          <div className="requests-right">

            {/* Request overview donut */}
            <div className="req-overview-div">
              <div className="req-overview-header">
                <span className="req-overview-title">Request Overview</span>
              </div>
              <div className="req-overview-main">
                <div className="req-donut-div">
                  <svg width="120" height="120" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} />
                    {(() => {
                      let accumulatedLength = 0;
                      return overviewSegments.map((segment, index) => {
                        const fraction = segment.value / total;
                        const gap = overviewSegments.length > 1 ? 4 : 0;
                        const segmentLength = fraction * circumference - gap;
                        const circle = (
                          <circle
                            key={index}
                            cx="70" cy="70" r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={`${segmentLength} ${circumference}`}
                            strokeDashoffset={-accumulatedLength}
                            transform="rotate(-90 70 70)"
                          />
                        );
                        accumulatedLength += fraction * circumference;
                        return circle;
                      });
                    })()}
                  </svg>
                  <div className="req-chart-content">
                    <h2>{requests.length}</h2>
                    <p>Total</p>
                  </div>
                </div>
                <div className="req-overview-legend">
                  <div className="req-legend-row">
                    <div className="req-dot" style={{ backgroundColor: "#f59e0b" }}></div>
                    <span>Pending</span>
                    <span className="req-legend-count">{pendingRequests.length}</span>
                  </div>
                  <div className="req-legend-row">
                    <div className="req-dot" style={{ backgroundColor: "#10B981" }}></div>
                    <span>Approved</span>
                    <span className="req-legend-count">{approvedRequests.length}</span>
                  </div>
                  <div className="req-legend-row">
                    <div className="req-dot" style={{ backgroundColor: "#ef4444" }}></div>
                    <span>Rejected</span>
                    <span className="req-legend-count">{rejectedRequests.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top projects by requests */}
            <div className="top-projects-div">
              <div className="top-projects-header">
                <span className="top-projects-title">Top Projects by Requests</span>
              </div>
              {topProjects.length === 0 && (
                <div className="requests-empty-state">No data yet.</div>
              )}
              {topProjects.map(([title, count]) => (
                <div key={title} className="top-project-row">
                  <div className="top-project-left">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <span className="top-project-name">{title}</span>
                  </div>
                  <span className="top-project-count">{count} requests</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Requests;