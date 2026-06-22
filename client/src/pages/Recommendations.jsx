import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { getRecommendedProjects, getRecommendedDevelopers } from "../services/recommendationServices.js";
import { joinProject } from "../services/projectServices.js";
import { connectWithUser, disconnectFromUser, getMyConnections, inviteUserToProject, getMyInvites } from "../services/connectionServices.js";
import Sidebar from "../components/Sidebar.jsx";
import "./Recommendations.css";

function Recommendations() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("projects");

  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [joinedIds, setJoinedIds] = useState([]);

  const [recommendedDevelopers, setRecommendedDevelopers] = useState([]);
  const [loadingDevs, setLoadingDevs] = useState(true);
  const [connectedIds, setConnectedIds] = useState([]);
  const [invitedIds, setInvitedIds] = useState([]);

  useEffect(() => {
    if (!token) return;
    getRecommendedProjects(token)
      .then((res) => setRecommendedProjects(res.data.recommendations || []))
      .catch((err) => console.error("Failed to load project recommendations:", err))
      .finally(() => setLoadingProjects(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    getRecommendedDevelopers(token)
      .then((res) => setRecommendedDevelopers(res.data.recommendations || []))
      .catch((err) => console.error("Failed to load developer recommendations:", err))
      .finally(() => setLoadingDevs(false));

    getMyConnections(token)
      .then((res) => setConnectedIds(res.data.connected_ids || []))
      .catch((err) => console.error(err));

    getMyInvites(token)
      .then((res) => setInvitedIds(res.data.invited_ids || []))
      .catch((err) => console.error(err));
  }, [token]);

  const handleJoin = (project) => {
    joinProject(project._id, token)
      .then((res) => {
        setJoinedIds((prev) => [...prev, project._id]);
        alert(res.data.message);
      })
      .catch((error) => {
        console.error(error);
        alert(error.response?.data?.message || "Failed to join project");
      });
  };

  const toggleConnect = (githubId) => {
    const isConnected = connectedIds.includes(githubId);
    const action = isConnected ? disconnectFromUser(githubId, token) : connectWithUser(githubId, token);
    action
      .then(() => {
        setConnectedIds((prev) =>
          isConnected ? prev.filter((id) => id !== githubId) : [...prev, githubId]
        );
      })
      .catch((err) => console.error(err));
  };

  const handleInvite = (githubId) => {
    if (!recommendedProjects.length) {
      alert("Create or join a project first before inviting someone.");
      return;
    }
    const projectId = recommendedProjects[0]._id; // simplest default; could open a picker later
    inviteUserToProject(githubId, projectId, token)
      .then(() => setInvitedIds((prev) => [...prev, githubId]))
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh", backgroundColor: "#fff", color: "#000" }}>
      <Sidebar activePage="recommendations" />
      <div className="recommendations-container">
        <div className="recommendations-header-section">
          <span className="recommendations-title">Recommendations</span>
          <span className="recommendations-subtitle">Find projects and developers that match your skills and interests.</span>
        </div>

        <div className="recommendations-tabs">
          <button className={`rec-tab ${activeTab === "projects" ? "rec-tab-active" : ""}`} onClick={() => setActiveTab("projects")}>Projects</button>
          <button className={`rec-tab ${activeTab === "developers" ? "rec-tab-active" : ""}`} onClick={() => setActiveTab("developers")}>Developers</button>
        </div>

        {activeTab === "projects" ? (
          loadingProjects ? (
            <p style={{ padding: "20px", color: "#9ca3af" }}>Loading recommendations...</p>
          ) : recommendedProjects.length === 0 ? (
            <p style={{ padding: "20px", color: "#9ca3af" }}>No recommendations yet — add some skills to your profile.</p>
          ) : (
            <div className="recommendations-grid">
              {recommendedProjects.slice(0, 6).map((project) => (
                <div key={project._id} className="rec-project-card">
                  <div className="rec-card-header">
                    <div className="rec-img-placeholder" />
                    <button className="rec-bookmark-btn" onClick={(e) => e.stopPropagation()}>
                      <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                      </svg>
                    </button>
                  </div>
                  <div className="rec-card-body">
                    <span className="rec-project-title">{project.title}</span>
                    <span className="rec-project-desc">{project.description}</span>
                    <div className="rec-skill-tags">
                      {project.required_skills?.slice(0, 3).map((skill) => (
                        <div key={skill} className="rec-skill-tag">{skill}</div>
                      ))}
                    </div>
                    <div className="rec-card-meta">
                      <span className="rec-members">{project.members?.length || 0}/{project.team_size || "?"} members</span>
                      <span className="rec-match-badge">{Math.round(project.match_score)}% match</span>
                    </div>
                  </div>
                  <div className="rec-card-actions">
                    <button className="rec-btn-outline" onClick={() => navigate(`/projects/${project._id}`)}>View Project</button>
                    <button
                      className="rec-btn-primary"
                      disabled={joinedIds.includes(project._id)}
                      onClick={() => handleJoin(project)}
                    >
                      {joinedIds.includes(project._id) ? "Joined ✓" : "Join Project"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : loadingDevs ? (
          <p style={{ padding: "20px", color: "#9ca3af" }}>Loading developers...</p>
        ) : recommendedDevelopers.length === 0 ? (
          <p style={{ padding: "20px", color: "#9ca3af" }}>No developer matches yet — add some skills to your profile.</p>
        ) : (
          <div className="recommendations-grid">
            {recommendedDevelopers.slice(0, 6).map((dev) => (
              <div key={dev.github_id} className="rec-dev-card">
                <div className="rec-dev-top">
                  <div className="rec-dev-avatar">{dev.username.charAt(0).toUpperCase()}</div>
                  <div className="rec-dev-info">
                    <span className="rec-dev-name">{dev.username}</span>
                    <span className="rec-dev-role">{dev.intent}</span>
                  </div>
                  <span className="rec-match-badge">{dev.match_score}%</span>
                </div>
                <div className="rec-skill-tags">
                  {dev.skills.map((skill) => (
                    <div key={skill} className="rec-skill-tag">{skill}</div>
                  ))}
                </div>
                <div className="rec-card-meta">
                  <span className="rec-members">Public Repos: {dev.public_repos}</span>
                </div>
                <div className="rec-card-actions rec-card-actions-3">
                  <button className="rec-btn-outline" onClick={() => navigate(`/profile/${dev.username}`)}>View Profile</button>
                  <button className="rec-btn-primary" onClick={() => toggleConnect(dev.github_id)}>
                    {connectedIds.includes(dev.github_id) ? "Connected ✓" : "Connect"}
                  </button>
                  <button
                    className="rec-btn-outline"
                    disabled={invitedIds.includes(dev.github_id)}
                    onClick={() => handleInvite(dev.github_id)}
                  >
                    {invitedIds.includes(dev.github_id) ? "Invited ✓" : "Invite"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Recommendations;