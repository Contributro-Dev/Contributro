import { useEffect, useContext, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getAllProjects, joinProject } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import "./Projects.css";

function Projects() {

  const { login, user, token, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false)

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
    console.log("token:", token)
    console.log("projectId:", projectId)
    joinProject(projectId, token).then(response => {
      console.log(response.data)
      alert(response.data.message);
    }).catch(error => {
      console.error(error);
      alert(error.response.data.message);
    })
  }

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
              <div className="profile-pic">{firstLetter}</div>
              <span>{user?.username || "User"}</span>
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
              <span className="projects-title">My Projects</span>
              <span className="projects-msg">Manage Projects you created and joined.</span>
            </div>
            <div className="projects-stats">
              <div className="projects-stat-card">
                <div className="stat-icon-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">5</span>
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
                  <span className="stat-number">8</span>
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
                  <span className="stat-number">4</span>
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
                <input type="text" placeholder="Search projects..." />
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Projects;