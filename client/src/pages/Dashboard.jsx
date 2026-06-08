import { useEffect, useContext, useState,useRef } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getUser } from "../services/authServices.js";
import { getAllProjects, joinProject } from "../services/projectServices.js";
import SkillsPopUp from "../components/SkillsPopUp.jsx";
import Sidebar from "../components/Sidebar.jsx";
import "./Dashboard.css";
// import api if you are using api.patch()
// import api from "../services/api.js"

function Dashboard() {

  const cardsRef = useRef(null)

  const { login, user, token, logout } = useContext(AuthContext);

  const [projects, setProjects] = useState([]);


  const [showSkillPopup, setShowSkillPopup] = useState(false)

  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [scrolled, setScrolled] = useState(false)

  const handleScroll = () => {
    setScrolled(cardsRef.current.scrollLeft > 10)
  }

  const scrollLeft = () => cardsRef.current.scrollBy({ left: -280, behavior: 'smooth' })
  const scrollRight = () => cardsRef.current.scrollBy({ left: 280, behavior: 'smooth' })



  // ─────────────────────────────────────────────
  // Handle GitHub OAuth redirect
  // ─────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const urlToken = params.get("token");
    const github_id = params.get("github_id");
    const isNewUser = params.get("new_user") === "true";

    if (urlToken && github_id) {
      getUser(github_id).then((response) => {
        login(response.data, urlToken);

        // Remove token from URL
        window.history.replaceState({}, document.title, "/dashboard");

        // Show popup if user has no skills
        if (
          !response.data.skills?.length ||
          !response.data.interests?.length ||
          !response.data.intent
        ) {
          setShowSkillPopup(true);
        }
      });
    } else if (user && user.skills?.length === 0) {
      setShowSkillPopup(true);
    }
  }, []);

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
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: '#fff', color: '#000' }}>

      <Sidebar activePage="dashboard" />
      {/* Dashboard content */}
      <div className="dashboard-container">

        {/* nav */}
        <div className="dashboard-nav">
          <input type="text" placeholder="Search projects, skills, or users..." className="search-bar" />
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
        <div className="dashboard-content">
          {/* left side / center */}
          <div className="left-panel">
            <span className="dashboard-greeting">Good Morning, {user?.username || "User"}</span>
            <span className="dashboard-welcome-msg">Lets build something incredible together today</span>
            <div className="dashboard-stats">
              <div className="dashboard-stat-card">
                <div className="stat-icon-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">12</span>
                  <span className="stat-label">Active Projects</span>
                  <span className="stat-sublabel">3 updates today</span>
                </div>
              </div>
              <div className="dashboard-stat-card">
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
                  <span className="stat-label">Contribution</span>
                  <span className="stat-sublabel">2 this week</span>
                </div>
              </div>
              <div className="dashboard-stat-card">
                <div className="stat-icon-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>

                </div>
                <div className="stat-info">
                  <span className="stat-number">24</span>
                  <span className="stat-label">Bookmarks</span>
                  <span className="stat-sublabel">Project saved</span>
                </div>
              </div>
              <div className="dashboard-stat-card">
                <div className="stat-icon-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>

                </div>
                <div className="stat-info">
                  <span className="stat-number">96%</span>
                  <span className="stat-label">Match Score</span>
                  <span className="stat-sublabel">Top 10% of developers</span>
                </div>
              </div>
            </div>
            <div className="recomended-projects-section">
              <span className="recomendation-header">
                Recommended For You
                <a href="#" className="view-all-link">View all recomendations {"->"}</a>
              </span>
              <span className="recomendation-subheader">
                projects that match your skills and interests
              </span>
              <div className="cards-carousel-wrapper">

                {scrolled && (
                  <button className="carousel-btn carousel-btn-left" onClick={scrollLeft}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}
                {scrolled && <div className="cards-fade-left" />}

                <div className="reconmended-projects-cards" ref={cardsRef} onScroll={handleScroll}>
                  <div className="project-card">
                    <div className="card-header card-bg-1">
                      <div className="icon-wraper" style={{ background: 'linear-gradient(135deg, #393989, #0c0f11)' }}>
                        <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="48" y2="48">
                              <stop offset="0%" stop-color="#b1c9fe" />
                              <stop offset="100%" stop-color="#b1c9fe" />
                            </linearGradient>
                          </defs>

                          <rect x="8" y="24" width="6" height="14" rx="2" fill="url(#chartGrad)" />
                          <rect x="19" y="16" width="6" height="22" rx="2" fill="url(#chartGrad)" />
                          <rect x="30" y="10" width="6" height="28" rx="2" fill="url(#chartGrad)" />
                        </svg>
                      </div>
                      <button className="bookmark-btn">
                        <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                      </button>
                    </div>
                    <div className="card-body">
                      <span className="project-card-title">DevFlow – Open Source Workflow Automation</span>
                      <span className="project-card-desc">Automate developer workflows and boost team productivity.</span>
                      <div className="project-card-skills">
                        <div className="skill-tag">Python</div>
                        <div className="skill-tag">React</div>
                        <div className="skill-tag">Mongodb</div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="star-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="card-star-count">128</span>
                      </div>
                      <div className="member-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="member-number">5/8</span>
                      </div>
                      <span className="match-badge">98% match</span>
                    </div>
                  </div>
                  <div className="project-card">
                    <div className="card-header card-bg-2">
                      <div className="icon-wraper" style={{ background: 'linear-gradient(135deg, #5e8939, #0c110d)' }}>
                        <svg width="30" height="30" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="leafGrad" x1="0" y1="0" x2="48" y2="48">
                              <stop offset="0%" stop-color="#22C55E" />
                              <stop offset="100%" stop-color="#10B981" />
                            </linearGradient>
                          </defs>

                          <path d="M38 10C24 10 12 18 12 30C12 36 16 40 22 40C34 40 38 28 38 10Z"
                            fill="url(#leafGrad)" />

                          <path d="M14 24C20 24 26 28 32 36"
                            stroke="white"
                            stroke-width="3"
                            stroke-linecap="round" />
                        </svg>
                      </div>
                      <button className="bookmark-btn">
                        <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                      </button>
                    </div>
                    <div className="card-body">
                      <span className="project-card-title">EcoTrack – Sustainability Tracking Web App</span>
                      <span className="project-card-desc">Track carbon footprint, set goals, and visualize impact.</span>
                      <div className="project-card-skills">
                        <div className="skill-tag">Node</div>
                        <div className="skill-tag">Express</div>
                        <div className="skill-tag">Tailwind</div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="star-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="card-star-count">95</span>
                      </div>
                      <div className="member-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="member-number">5/6</span>
                      </div>
                      <span className="match-badge">94% match</span>
                    </div>
                  </div>
                  <div className="project-card">
                    <div className="card-header card-bg-3">
                      <div className="icon-wraper" style={{ background: 'linear-gradient(135deg, #5c3989, #0f0c11)' }}>
                        <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="gameGrad" x1="0" y1="0" x2="48" y2="48">
                              <stop offset="0%" stop-color="#6366F1" />
                              <stop offset="100%" stop-color="#8B5CF6" />
                            </linearGradient>
                          </defs>

                          <path d="M14 16H34C40 16 44 20 44 26C44 32 40 38 35 38C32 38 30 36 28 33H20C18 36 16 38 13 38C8 38 4 32 4 26C4 20 8 16 14 16Z"
                            fill="url(#gameGrad)" />

                          <path d="M15 26H23" stroke="white" stroke-width="3" stroke-linecap="round" />
                          <path d="M19 22V30" stroke="white" stroke-width="3" stroke-linecap="round" />

                          <circle cx="31" cy="24" r="2" fill="white" />
                          <circle cx="35" cy="28" r="2" fill="white" />
                        </svg>
                      </div>
                      <button className="bookmark-btn">
                        <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                      </button>
                    </div>
                    <div className="card-body">
                      <span className="project-card-title">GameHub – Multiplayer Game Platform</span>
                      <span className="project-card-desc">Real-time multiplayer platform with chat, rooms and leaderboards</span>
                      <div className="project-card-skills">
                        <div className="skill-tag">C++</div>
                        <div className="skill-tag">WebSokets</div>
                        <div className="skill-tag">React</div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="star-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="card-star-count">75</span>
                      </div>
                      <div className="member-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="member-number">3/6</span>
                      </div>
                      <span className="match-badge">92% match</span>
                    </div>
                  </div>
                  <div className="project-card">
                    <div className="card-header card-bg-1">
                      <div className="icon-wraper" style={{ background: 'linear-gradient(135deg, #393989, #0c0f11)' }}>
                        <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="48" y2="48">
                              <stop offset="0%" stop-color="#b1c9fe" />
                              <stop offset="100%" stop-color="#b1c9fe" />
                            </linearGradient>
                          </defs>

                          <rect x="8" y="24" width="6" height="14" rx="2" fill="url(#chartGrad)" />
                          <rect x="19" y="16" width="6" height="22" rx="2" fill="url(#chartGrad)" />
                          <rect x="30" y="10" width="6" height="28" rx="2" fill="url(#chartGrad)" />
                        </svg>
                      </div>
                      <button className="bookmark-btn">
                        <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                      </button>
                    </div>
                    <div className="card-body">
                      <span className="project-card-title">DevFlow – Open Source Workflow Automation</span>
                      <span className="project-card-desc">Automate developer workflows and boost team productivity.</span>
                      <div className="project-card-skills">
                        <div className="skill-tag">Python</div>
                        <div className="skill-tag">React</div>
                        <div className="skill-tag">Mongodb</div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="star-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="card-star-count">128</span>
                      </div>
                      <div className="member-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="member-number">5/8</span>
                      </div>
                      <span className="match-badge">98% match</span>
                    </div>
                  </div>
                </div>

                <button className="carousel-btn carousel-btn-right" onClick={scrollRight}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                {/* fade gradient */}
                <div className="cards-fade-right" />
              </div>
            </div>
            <div className="recent-activity-section">
              <span className="recent-activity-header">
                Recent Activity
                <a href="#" className="view-all-link">View all activity {"->"}</a>
              </span>
              <div className="recent-activity-content">

                <div className="activity-item">
                  <div className="activity-avatar" style={{ background: 'linear-gradient(135deg, #7c3aed, #4b4db8)' }}>I</div>
                  <span className="activity-text"><strong>ishu2022</strong> updated DevFlow README.md</span>
                  <span className="activity-time">2 hours ago</span>
                </div>

                <div className="activity-item">
                  <div className="activity-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #2aaa7b)' }}>G</div>
                  <span className="activity-text"><strong>green_coder</strong> added a new issue in EcoTrack</span>
                  <span className="activity-time">5 hours ago</span>
                </div>

                <div className="activity-item">
                  <div className="activity-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ba9023)' }}>P</div>
                  <span className="activity-text"><strong>pixel_pirate</strong> merged PR #42 in GameHub</span>
                  <span className="activity-time">1 day ago</span>
                </div>

                <div className="activity-item">
                  <div className="activity-avatar" style={{ background: 'linear-gradient(135deg, #ef4444, #783636)' }}>K</div>
                  <span className="activity-text"><strong>Kaivalya</strong> joined DevConnect as Frontend Dev</span>
                  <span className="activity-time">2 days ago</span>
                </div>

                <div className="activity-item">
                  <div className="activity-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6, #254060)' }}>A</div>
                  <span className="activity-text"><strong>alex_builds</strong> created a new project AI Resume Analyzer</span>
                  <span className="activity-time">3 days ago</span>
                </div>

              </div>
            </div>
          </div>
          {/* right side */}
          <div className="right-panel">
            {/* contribution hashmap */}
            <div className="github-hash-tab">
              <span className="github-hash-header">
                Your Github Contributions
                <a href="#" className="view-all-link">view All {"->"}</a>
              </span>
              <div className="contribution-count">
                <span className="contribution-count-number">123</span>
                <span className="contribution-count-label">Contributions</span>
                <select className="contribution-year-selector">
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>
              <div className="github-hash-content">
                <div className="github-heatmap">
                  {Array.from({ length: 52 }).map((_, weekIndex) => (
                    <div key={weekIndex} className="heatmap-column">
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const level = Math.floor(Math.random() * 5);
                        return (
                          <div
                            key={dayIndex}
                            className={`heatmap-cell level-${level}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <span className="contribution-count-label">Longest streak: 12 days</span>
            </div>

            {/* Trending projects */}
            <div className="trending-projects">
              <span className="trending-projects-header">
                Trending Projects
                <a href="#" className="view-all-link">view All {"->"}</a>
              </span>
              <div className="trending-projects-content">
                <div className="trending-item">
                  <div className="trending-rank-1">1</div>
                  <div className="trending-info">
                    <span className="trending-title">AI Code Asistant</span>
                    <span className="trending-skills">Python, FastAPI, React</span>
                  </div>
                  <div className="trending-rating">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="rating-count">153</span>
                  </div>
                </div>
                <div className="trending-item">
                  <div className="trending-rank-2">2</div>
                  <div className="trending-info">
                    <span className="trending-title">Open Source Docs</span>
                    <span className="trending-skills">MDX, Tailwind , React</span>
                  </div>
                  <div className="trending-rating">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="rating-count">113</span>
                  </div>
                </div>
                <div className="trending-item">
                  <div className="trending-rank-3">3</div>
                  <div className="trending-info">
                    <span className="trending-title">DevPortfolio Starter</span>
                    <span className="trending-skills">Next.js, Tailwind, Typscript</span>
                  </div>
                  <div className="trending-rating">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="rating-count">69</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="community-highlights">
              <div className="community-upper">
                <span className="community-highlights-header">Community Highlights</span>
                <span className="community-highlights-subheader">See what the community is up to</span>
              </div>
              <div className="community-highlights-content">
                <div className="community-bar">
                  <div className="bar-info">
                    <span className="bar-header"> 12.5k+ developers</span>
                    <span className="bar-subheader">building together</span>
                  </div>
                  <div className="bar-icons">
                    <div className="bar-icon" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=1)' }}></div>
                    <div className="bar-icon" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=2)' }}></div>
                    <div className="bar-icon" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=3)' }}></div>
                    <div className="bar-icon" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?img=4)' }}></div>
                    <div className="bar-icon-count">+320</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Modals */}
        {showSkillPopup && <SkillsPopUp onClose={() => setShowSkillPopup(false)} />}
      </div>
    </div>

  );
}

export default Dashboard;