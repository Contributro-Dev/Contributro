import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getUser } from "../services/authServices.js";
import { getAllProjects, joinProject } from "../services/projectServices.js";
import SkillsPopUp from "../components/SkillsPopUp.jsx";
import Sidebar from "../components/Sidebar.jsx";
import "./Dashboard.css";
// import api if you are using api.patch()
// import api from "../services/api.js";

function Dashboard() {
  const { login, user, token } = useContext(AuthContext);

  const [projects, setProjects] = useState([]);


  const [showSkillPopup, setShowSkillPopup] = useState(false)


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
      <div>

        {/* nav */}
        <div className="dashboard-nav">
          <input type="text" placeholder="Search projects..." className="search-bar" />
          <button className="theme-toggle"></button>
          <button className="notifications"></button>
          <div className="profile-section">
            <div className="profile-pic">{firstLetter}</div>
            <span>{user?.username || "User"}</span>
          </div>
        </div>
        <div className="dashboard-content">
          <div className="left-panel">
            <span className="dashboard-greeting">Good Morning, {user?.username || "User"}</span>
            <span className="dashboard-welcome-msg">Lets build something incredible together today</span>
            <div className="dashboard-stats">
              <div className="dashboard-stat-card"></div>
              <div className="dashboard-stat-card"></div>
              <div className="dashboard-stat-card"></div>
              <div className="dashboard-stat-card"></div>
            </div>
            <div className="recomended-projects-section">
              <span className="recomendation-header"></span>
              <span className="recomendation-subheader"></span>
              <div className="reconmended-projects-cards">

              </div>
            </div>
            <div className="recent-activity-section">
              <span className="recent-activity-header">
                Recent Activity
                <a href="#" className="view-all-link">view All</a>
              </span>
              <div className="recent-activity-content">

              </div>
            </div>
          </div>
          <div className="right-panel">
            {/* contribution hashmap */}
            <div className="github-hash-tab">
              <span className="github-hash-header">
                Your Github Contributions
                <a href="#" className="view-all-link">view All</a>
              </span>
              <div className="contribution-count">
                <span className="contribution-count-number">123</span>
                <span className="contribution-count-label">Contributions</span>
                <input type="date" className="contribution-year-selector" />
              </div>
              <div className="github-hash-content">

              </div>
            </div>

            {/* Trending projects */}
            <div className="trending-projects">
              <span className="trending-projects-header">
                Trending Projects
                <a href="#" className="view-all-link">view All</a>
              </span>
              <div className="trending-projects-content">

              </div>
            </div>

            <div className="community-highlights">
              <span className="community-highlights-header">Community Highlights</span>
              <span className="community-highlights-subheader">See what the community is up to</span>
              <div className="community-highlights-content">

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