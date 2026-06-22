import { useEffect, useContext, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getAllProjects, joinProject, getMyJoinRequests, handleJoinRequest, toggleStar } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import { useNavigate } from 'react-router-dom'
import "./Projects.css";

function Projects() {

  const { login, user, token, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [filter, setFilter] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [joinRequests, setJoinRequests] = useState([]);

  const navigate = useNavigate()

  // ─────────────────────────────────────────────
  // Load projects
  // ─────────────────────────────────────────────
  useEffect(() => {
    getAllProjects().then((response) => {
      setProjects(response.data);
    });
  }, []);

  // ─────────────────────────────────────────────
  // Join project
  // ─────────────────────────────────────────────
  const handleJoinProject = (projectId) => {
    joinProject(projectId, token).then(response => {
      alert(response.data.message);
      const update = (list) => list.map(p =>
        p._id === projectId ? { ...p, has_pending_request: true } : p
      );
      setProjects(prev => update(prev));
      setRecommendedProjects(prev => update(prev));
    }).catch(error => {
      console.error(error);
      alert(error.response.data.message);
    });
  };

  const handleRequestAction = (projectId, requestId, action) => {
    handleJoinRequest(projectId, requestId, action, token).then(() => {
      setJoinRequests(prev =>
        prev.map(req =>
          req._id === requestId ? { ...req, status: action === "approve" ? "approved" : "rejected" } : req
        )
      );
    }).catch(err => console.error(err));
  };

  const handleToggleStar = (e, projectId) => {
    e.stopPropagation();
    toggleStar(projectId, token).then(response => {
      setProjects(prev => prev.map(p =>
        p._id === projectId ? { ...p, stars: response.data.star_count, is_starred: response.data.starred } : p
      ));
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    getAllProjects().then((response) => {
      setProjects(response.data);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    getMyJoinRequests(token).then((response) => {
      setJoinRequests(response.data);
    }).catch((error) => {
      console.error(error);
    });
  }, [token]);

  const pendingJoinRequests = joinRequests.filter(r => r.status === "pending");
  const createdProjects = projects.filter(p => String(p.owner_github_id) === String(user.github_id))
  const joinedProjects = projects.filter(p =>
    String(p.owner_github_id) !== String(user.github_id) &&
    p.members.map(String).includes(String(user.github_id))
  )

  const allMyProjects = [...createdProjects, ...joinedProjects]

  const displayedProjects = allMyProjects
    .filter(p => filter === "all" || p.status === filter)
    .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))



  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
      <Sidebar activePage="my-projects" />

      <div className="projects-container">

        <div className="projects-nav">
          <div className="search-bar">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search projects..." />
          </div>
          <div className="nav-right">
            <button className="theme-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>

            </button>
            <div className="profile-section" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="profile-pic">{user?.avatar
                ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                : firstLetter}</div>
              <span>{user?.name || user?.username || "User"}</span>
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

        <div className="projects-content">

          <div className="projects-center">
            {/* Header + stats */}
            <div className="projects-header">
              <div className="header-left">
                <span className="projects-title">My Projects</span>
                <span className="projects-msg">Manage Projects you created and joined.</span>
              </div>
              <div className="header-right">
                <div className='create-div' onClick={() => navigate('/create-project')}>
                  <span className="create-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="create-label">Create New Project</span>
                </div>
              </div>

            </div>
            <div className="projects-stats">
              <div className="projects-stat-card">
                <div className="stat-icon-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">{createdProjects.length}</span>
                  <span className="stat-label">Project Created</span>
                  <span className="stat-sublabel">3 active</span>
                </div>
              </div>
              <div className="projects-stat-card">
                <div className="stat-icon-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>

                </div>
                <div className="stat-info">
                  <span className="stat-number">{joinedProjects.length}</span>
                  <span className="stat-label">Projects Joined</span>
                  <span className="stat-sublabel">2 Active</span>
                </div>
              </div>
              <div className="projects-stat-card">
                <div className="stat-icon-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
                    <rect width="64" height="64" rx="16" />

                    <circle cx="32" cy="32" r="16" stroke="#E65100" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

                    <path d="M32 22V32H40" stroke="#E65100" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                </div>
                <div className="stat-info">
                  <span className="stat-number">{pendingJoinRequests.length}</span>
                  <span className="stat-label">Pending Requests</span>
                  <span className="stat-sublabel">Awaiting response</span>
                </div>
              </div>
              <div className="projects-stat-card">
                <div className="stat-icon-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
                    <rect width="64" height="64" rx="16" />

                    <circle cx="32" cy="32" r="16" stroke="#4A148C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

                    <path d="M24 32L29.5 37.5L40 26.5" stroke="#4A148C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>


                </div>
                <div className="stat-info">
                  <span className="stat-number">2</span>
                  <span className="stat-label">Completed Projects</span>
                  <span className="stat-sublabel">Great job!</span>
                </div>
              </div>
            </div>
            {/* Search Tab , Filters*/}
            <div className="projects-search-tab">
              <div className="search-bar-tab">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              {/* Select sort*/}
              {/* 1st */}
              <select className="sort-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option>All Projects</option>
                <option>Active</option>
                <option>Recruting</option>
                <option>Completed</option>
              </select>
              {/* 2nd */}
              <select className="sort-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option>Sort by: Newest</option>
                <option>Sort by: Most Stars</option>
                <option>Sort by: Most Members</option>
              </select>
              {/* View Toggle */}
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === "grid" ? "view-btn-active" : ""}`} onClick={() => setViewMode("grid")}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button className={`view-btn ${viewMode === "list" ? "view-btn-active" : ""}`} onClick={() => setViewMode("list")}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="projects-grid-section">
              <div className="projects-grid-header">
                <div className="projects-grid-title-group">
                  <span className="projects-grid-title">All Projects</span>
                  <span className="projects-grid-count">{displayedProjects.length} projects</span>
                </div>
              </div>

              {displayedProjects.length === 0 ? (
                <div className="projects-empty">
                  <span>No projects found.</span>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "all-projects-grid" : "all-projects-list"}>
                  {displayedProjects.map((project, i) => {
                    const isOwner = String(project.owner_github_id) === String(user.github_id)
                    const isMember = String(project.owner_github_id) !== String(user.github_id) &&
                      project.members.map(String).includes(String(user.github_id));
                    const bgClass = `card-bg-${(i % 3) + 1}`;
                    return (
                      <div className="project-card" key={project._id} onClick={() => navigate(`/projects/${project._id}`)}>
                        <div className={`card-header ${bgClass}`}>
                          <div className="icon-wraper" style={{ background: "#fff" }}>
                            <svg width="20" height="20" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                            </svg>
                          </div>
                          {isOwner && <span className="owner-badge">Owner</span>}
                        </div>

                        <div className="card-body">
                          <div className="project-card-status-row">
                            <span className={`status-badge status-${project.status}`}>
                              {project.status === "open" ? "Active" : project.status}
                            </span>
                          </div>
                          <span className="project-card-title">{project.title}</span>
                          <span className="project-card-desc">{project.description}</span>
                          <div className="project-card-skills">
                            {(project.required_skills || []).slice(0, 3).map(skill => (
                              <span className="skill-tag" key={skill}>{skill}</span>
                            ))}
                          </div>
                        </div>

                        <div className="card-footer">
                          <div className="member-container">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                            </svg>
                            <span className="member-number">{project.members?.length || 0} members</span>
                          </div>
                          <div
                            className="star-container"
                            onClick={(e) => handleToggleStar(e, project._id)}
                            style={{ cursor: "pointer" }}
                          >
                            <svg
                              width="14" height="14"
                              fill={project.is_starred ? "#F59E0B" : "none"}
                              stroke={project.is_starred ? "#F59E0B" : "currentColor"}
                              strokeWidth="2" viewBox="0 0 24 24"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            <span className="card-star-count">{project.stars || 0}</span>
                          </div>
                        </div>

                        <div className="join-container">
                          {isOwner ? (
                            <button className="join-btn your-project-btn">Your Project</button>
                          ) : isMember ? (
                            <button className="join-btn joined-btn">Joined ✓</button>
                          ) : project.has_pending_request ? (
                            <button className="join-btn pending-btn" disabled>Request Pending</button>
                          ) : (
                            <button className="join-btn" onClick={(e) => { e.stopPropagation(); handleJoinProject(project._id); }}>
                              Join Project
                            </button>
                          )}
                          <button className="bottom-bookmark-btn">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="projects-right">

            {/* Recent Join Requests */}
            <div className="right-section">
              <div className="right-section-header">
                <span className="right-section-title">Recent Join Requests</span>
                <a className="view-all-link" onClick={() => navigate('/requests')} style={{ cursor: "pointer" }}>View all</a>
              </div>
              {pendingJoinRequests.length === 0 ? (
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>No pending requests.</span>
              ) : (
                pendingJoinRequests.slice(0, 3).map((req) => (
                  <div className="join-request-item" key={req._id}>
                    <div className="request-avatar">{req.username?.charAt(0).toUpperCase() || "U"}</div>
                    <div className="request-info">
                      <span className="request-name">{req.username}</span>
                      <span className="request-role">{req.project_title}</span>
                      <div className="request-skills">
                        {(req.required_skills || []).slice(0, 3).map(s => (
                          <span className="skill-tag" key={s}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="request-actions">
                      <button className="approve-btn" onClick={() => handleRequestAction(req.project_id, req._id, "approve")}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                      </button>
                      <button className="reject-btn" onClick={() => handleRequestAction(req.project_id, req._id, "reject")}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Project Activity */}
            <div className="right-section">
              <div className="right-section-header">
                <span className="right-section-title">Project Activity</span>
                <a className="view-all-link">View all</a>
              </div>
              {[
                {
                  icon:
                    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                      <rect width="64" height="64" rx="16" fill="#ebf0fe" />
                      <g stroke="#0047b3" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(20, 20)">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </g>
                    </svg>

                  , text: "Priya Kapoor joined Contributro Platform", time: "2 hours ago"
                },
                {
                  icon:
                    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                      <rect width="64" height="64" rx="16" fill="#edeefe" />
                      <g stroke="#3333cc" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(20, 20)">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                        <line x1="14" y1="4" x2="10" y2="20" />
                      </g>
                    </svg>

                  , text: "Rahul Sharma submitted a pull request EcoTrack", time: "5 hours ago"
                },
                {
                  icon:
                    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                      <rect width="64" height="64" rx="16" fill="#f5edfd" />
                      <g stroke="#6600cc" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(20, 20)">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="M10 14.5 l 2 2 l 2 -2" />
                      </g>
                    </svg>

                  , text: "Arjun Singh updated project timeline GameHub", time: "1 day ago"
                },
                {
                  icon:
                    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                      <rect width="64" height="64" rx="16" fill="#faebf5" />
                      <g stroke="#b30086" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(20, 20)">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </g>
                    </svg>

                  , text: "Neha Patel added new skill requirement AI Resume Analyzer", time: "1 day ago"
                },
                {
                  icon:
                    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                      <rect width="64" height="64" rx="16" fill="#eceefe" />
                      <g stroke="#4d00b3" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(20, 20)">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </g>
                    </svg>

                  , text: "You created project DevConnect", time: "3 days ago"
                },
              ].map((item, i) => (
                <div className="right-activity-item" key={i}>
                  <div className="activity-icon-bubble">{item.icon}</div>
                  <div className="right-activity-info">
                    <span className="right-activity-text">{item.text}</span>
                    <span className="right-activity-time">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Deadlines */}
            <div className="right-section">
              <div className="right-section-header">
                <span className="right-section-title">Upcoming Deadlines</span>
                <a className="view-all-link">View all</a>
              </div>
              {[
                {
                  icon:
                    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                      <rect width="64" height="64" rx="16" fill="#fce8e8" />
                      <g stroke="#b3001b" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(20, 20)">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                        <circle cx="14" cy="10" r="1.5" />
                      </g>
                    </svg>
                  , name: "Contributro Platform", remaining: "2 months remaining", date: "JUL 15", color: "#7c3aed", bg: "#f5f3ff"
                },
                {
                  icon:
                    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                      <rect width="64" height="64" rx="16" fill="#e8faeb" />
                      <g stroke="#00802b" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(20, 20)">
                        <path d="M11 20v-5" />
                        <path d="M11 15c4-4 9-3 10-10-7 1-8 6-10 10z" />
                        <path d="M11 15c-3-2-6-2-8-6 5 0 7 3 8 6z" />
                        <path d="M11 15l4-4" />
                      </g>
                    </svg>

                  , name: "EcoTrack", remaining: "1 month remaining", date: "JUN 20", color: "#10b981", bg: "#d1fae5"
                },
                {
                  icon:
                    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                      <rect width="64" height="64" rx="16" fill="#f5ebfe" />
                      <g stroke="#6600cc" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(20, 20)">
                        <path d="M22 13.5c0 3-2 5.5-4.5 5.5-2 0-3.5-1.5-3.5-1.5H10s-1.5 1.5-3.5 1.5C4 19 2 16.5 2 13.5 2 9.5 3.5 7 6.5 7h11c3 0 4.5 2.5 4.5 6.5z" />
                        <line x1="6" y1="11" x2="10" y2="11" />
                        <line x1="8" y1="9" x2="8" y2="13" />
                        <line x1="15" y1="12" x2="15.01" y2="12" stroke-width="3" />
                        <line x1="17" y1="10" x2="17.01" y2="10" stroke-width="3" />
                      </g>
                    </svg>

                  , name: "GameHub", remaining: "3 months remaining", date: "AUG 10", color: "#f59e0b", bg: "#fef3c7"
                },
              ].map((d, i) => (
                <div className="deadline-item" key={i}>
                  <div className="deadline-icon" style={{ background: d.bg, color: d.color }}>{d.icon}</div>
                  <div className="deadline-info">
                    <span className="deadline-name">{d.name}</span>
                    <span className="deadline-remaining">{d.remaining}</span>
                  </div>
                  <div className="deadline-date" style={{ color: d.color }}>
                    <span className="deadline-month">{d.date.split(" ")[0]}</span>
                    <span className="deadline-day">{d.date.split(" ")[1]}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Projects;