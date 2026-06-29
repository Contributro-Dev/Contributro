import { useEffect, useContext, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getUser } from "../services/authServices.js";
import { getAllProjects, joinProject, getRecentActivity, getTrendingProjects, toggleStar } from "../services/projectServices.js";
import { getRecommendedProjects } from "../services/recommendationServices.js";
import SkillsPopUp from "../components/SkillsPopUp.jsx";
import Sidebar from "../components/Sidebar.jsx";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
// Dashboard.jsx — add these two lines near the top, with other imports
import { useTheme } from "../context/ThemeContext.jsx";
import { FiMoon, FiSun } from "react-icons/fi";

function Dashboard() {

  const cardsRef = useRef(null)

  const { login, user, token, logout } = useContext(AuthContext);

  const [projects, setProjects] = useState([]);
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  // Dashboard.jsx — inside function Dashboard(), alongside other hooks
  const { theme, toggleTheme } = useTheme();


  const [showSkillPopup, setShowSkillPopup] = useState(false)

  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [scrolled, setScrolled] = useState(false)

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [trendingProjects, setTrendingProjects] = useState([]);

  const [bookmarkCount, setBookmarkCount] = useState(0);

  const navigate = useNavigate()

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

  // BookMarks count
  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    setBookmarkCount(savedIds.length);
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
  // Load AI recommendations
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    getRecommendedProjects(token).then((response) => {
      setRecommendedProjects(response.data.recommendations);
    }).catch((error) => {
      console.error("Failed to load recommendations:", error);
    });
  }, [token]);

  //Load Recent Activity
  useEffect(() => {
    if (!token) return;

    const fetchActivity = () => {
      getRecentActivity(token).then((response) => {
        setActivities(response.data);
        setActivitiesLoading(false);
      }).catch((error) => {
        console.error("Failed to load recent activity:", error);
        setActivitiesLoading(false);
      });
    };

    fetchActivity(); // initial load

    const intervalId = setInterval(fetchActivity, 10000); // refetch every 30s

    return () => clearInterval(intervalId); // cleanup on unmount
  }, [token]);

  //trending projects

  useEffect(() => {
    getTrendingProjects().then((response) => {
      setTrendingProjects(response.data);
    }).catch((error) => {
      console.error("Failed to load trending projects:", error);
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

  const handleToggleStar = (e, projectId) => {
    e.stopPropagation();
    toggleStar(projectId, token).then(response => {
      setRecommendedProjects(prev => prev.map(p =>
        p._id === projectId ? { ...p, stars: response.data.star_count, is_starred: response.data.starred } : p
      ));
      fetchTrending();
    }).catch(err => console.error(err));
  };

  const fetchTrending = () => {
    getTrendingProjects().then((response) => {
      setTrendingProjects(response.data);
    }).catch((error) => {
      console.error("Failed to load trending projects:", error);
    });
  };

  useEffect(() => {
    fetchTrending();
  }, []);


  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

  function timeAgo(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? "s" : ""} ago`;
  }

  function activityText(activity) {
    switch (activity.type) {
      case "project_created":
        return <><strong>{activity.username}</strong> created a new project {activity.project_title}</>;
      case "joined_project":
        return <><strong>{activity.username}</strong> joined {activity.project_title}</>;
      case "join_requested":
        return <><strong>{activity.username}</strong> requested to join {activity.project_title}</>;
      case "commit":
        return <><strong>{activity.username}</strong> pushed a commit to {activity.project_title}: "{activity.message}"</>;
      case "issue_opened":
        return <><strong>{activity.username}</strong> opened an issue in {activity.project_title}: "{activity.message}"</>;
      case "pr_merged":
        return <><strong>{activity.username}</strong> merged a PR in {activity.project_title}: "{activity.message}"</>;
      case "pr_opened":
        return <><strong>{activity.username}</strong> opened a PR in {activity.project_title}: "{activity.message}"</>;
      default:
        return <><strong>{activity.username}</strong> did something in {activity.project_title}</>;
    }
  }

  const avatarGradients = [
    "linear-gradient(135deg, #7c3aed, #4b4db8)",
    "linear-gradient(135deg, #10b981, #2aaa7b)",
    "linear-gradient(135deg, #f59e0b, #ba9023)",
    "linear-gradient(135deg, #ef4444, #783636)",
    "linear-gradient(135deg, #3b82f6, #254060)",
  ];

  function gradientFor(username) {
    if (!username) return avatarGradients[0];
    const hash = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return avatarGradients[hash % avatarGradients.length];
  }

  return (
    // Dashboard.jsx — replace the outer wrapping div's inline style
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      <Sidebar activePage="dashboard" />
      {/* Dashboard content */}
      <div className="dashboard-container">

        {/* nav */}
        <div className="dashboard-nav">
          <input type="text" placeholder="Search projects, skills, or users..." className="search-bar" />
          <div className="nav-right">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
              {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
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
        <div className="dashboard-content">
          {/* left side / center */}
          <div className="left-panel">
            <span className="dashboard-greeting">Good Morning, {user?.name || user?.username || "User"}</span>
            <span className="dashboard-welcome-msg">Lets build something incredible together today</span>
            <div className="dashboard-stats">
              <div className="dashboard-stat-card">
                <div className="stat-icon-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    {projects.filter(p => p.members?.map(String).includes(String(user?.github_id))).length}
                  </span>
                  <span className="stat-label">Active Projects</span>
                  <span className="stat-sublabel">Projects you've joined</span>
                </div>
              </div>
              <div className="dashboard-stat-card">
                <div className="stat-icon-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>

                </div>
                <div className="stat-info">
                  <span className="stat-number">{bookmarkCount}</span>
                  <span className="stat-label">Bookmarks</span>
                  <span className="stat-sublabel">Project saved</span>
                </div>
              </div>
              <div className="dashboard-stat-card">
                <div className="stat-icon-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>

                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    {recommendedProjects.length > 0
                      ? Math.round(recommendedProjects.reduce((sum, p) => sum + p.match_score, 0) / recommendedProjects.length)
                      : 0}%
                  </span>
                  <span className="stat-label">Match Score</span>
                  <span className="stat-sublabel">Top 10% of developers</span>
                </div>
              </div>
            </div>
            <div className="recomended-projects-section">
              <span className="recomendation-header">
                Recommended For You
                <a href="#" className="view-all-link" onClick={(e) => { e.preventDefault(); navigate('/recommendations'); }}>View all recomendations {"->"}</a>
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
                  {recommendedProjects.length === 0 ? (
                    <p style={{ padding: '12px', color: '#9ca3af' }}>
                      No recommendations yet — add some skills to your profile.
                    </p>
                  ) : (
                    recommendedProjects.map(project => (
                      <div key={project._id} className="project-card" onClick={() => navigate(`/projects/${project._id}`)}>
                        <div className="card-header card-bg-1">
                          <div className="icon-wraper" style={{ background: 'linear-gradient(135deg, #393989, #0c0f11)' }}>
                            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="8" y="24" width="6" height="14" rx="2" fill="#b1c9fe" />
                              <rect x="19" y="16" width="6" height="22" rx="2" fill="#b1c9fe" />
                              <rect x="30" y="10" width="6" height="28" rx="2" fill="#b1c9fe" />
                            </svg>
                          </div>
                          <button className="bookmark-btn" onClick={(e) => e.stopPropagation()}>
                            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                          </button>
                        </div>
                        <div className="card-body">
                          <span className="project-card-title">{project.title}</span>
                          <span className="project-card-desc">{project.description}</span>
                          <div className="project-card-skills">
                            {project.required_skills?.slice(0, 3).map(skill => (
                              <div key={skill} className="skill-tag">{skill}</div>
                            ))}
                          </div>
                        </div>
                        <div className="card-footer">
                          <div className="star-container" onClick={(e) => handleToggleStar(e, project._id)} style={{ cursor: "pointer" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"
                              fill={project.is_starred ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            <span className="card-star-count">{project.stars || 0}</span>
                          </div>
                          <div className="member-container">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span className="member-number">{project.members?.length || 0}/{project.team_size || '?'}</span>
                          </div>
                          <span className="match-badge">{project.match_score}% match</span>
                        </div>
                      </div>
                    ))
                  )}
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
                {activitiesLoading ? (
                  <p style={{ padding: '12px', color: '#9ca3af' }}>Loading activity...</p>
                ) : activities.length === 0 ? (
                  <p style={{ padding: '12px', color: '#9ca3af' }}>No recent activity yet.</p>
                ) : (
                  activities.map((activity, i) => (
                    <div className="activity-item" key={i}>
                      <div className="activity-avatar" style={{ background: gradientFor(activity.username) }}>
                        {activity.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <span className="activity-text">{activityText(activity)}</span>
                      <span className="activity-time">{timeAgo(activity.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* right side */}
          <div className="right-panel">

            {/* Trending projects */}
            <div className="trending-projects">
              <span className="trending-projects-header">
                Trending Projects
                <a href="#" className="view-all-link">view All {"->"}</a>
              </span>
              <div className="trending-projects-content">
                {trendingProjects.length === 0 ? (
                  <p style={{ padding: '12px', color: '#9ca3af', fontSize: '0.75rem' }}>
                    No trending projects yet — star a project to get this started!
                  </p>
                ) : (
                  trendingProjects.map((project, i) => (
                    <div
                      className="trending-item"
                      key={project._id}
                      onClick={() => navigate(`/projects/${project._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className={`trending-rank-${i + 1}`}>{i + 1}</div>
                      <div className="trending-info">
                        <span className="trending-title">{project.title}</span>
                        <span className="trending-skills">{(project.required_skills || []).join(", ")}</span>
                      </div>
                      <div className="trending-rating">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="rating-count">{project.stars}</span>
                      </div>
                    </div>
                  ))
                )}
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