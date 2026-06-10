import { useParams } from 'react-router-dom'
import { useEffect, useContext, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getProject, joinProject } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import { useNavigate } from 'react-router-dom'
import "./ProjectDetail.css";

function ProjectDetail() {

  const { login, user, token, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const navigate = useNavigate()


  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
      <Sidebar activePage="" />
      <div className="project-detail-container">

        {/* navbar */}
        <div className="project-detail-nav">
          <div className="search-bar">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search projects, skills, technologies..." />
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
        
        

      </div>
    </div>
  )
}

export default ProjectDetail;