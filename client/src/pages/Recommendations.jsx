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
      .catch((err) => console.error(err))
      .finally(() => setLoadingProjects(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    getRecommendedDevelopers(token)
      .then((res) => setRecommendedDevelopers(res.data.recommendations || []))
      .catch((err) => console.error(err))
      .finally(() => setLoadingDevs(false));
    getMyConnections(token)
      .then((res) => setConnectedIds(res.data.connected_ids || []))
      .catch(console.error);
    getMyInvites(token)
      .then((res) => setInvitedIds(res.data.invited_ids || []))
      .catch(console.error);
  }, [token]);

  const handleJoin = (project) => {
    joinProject(project._id, token)
      .then((res) => { setJoinedIds((prev) => [...prev, project._id]); alert(res.data.message); })
      .catch((err) => alert(err.response?.data?.message || "Failed to join project"));
  };

  const toggleConnect = (githubId) => {
    const isConnected = connectedIds.includes(githubId);
    (isConnected ? disconnectFromUser(githubId, token) : connectWithUser(githubId, token))
      .then(() => setConnectedIds((prev) => isConnected ? prev.filter((id) => id !== githubId) : [...prev, githubId]))
      .catch(console.error);
  };

  const handleInvite = (githubId) => {
    if (!recommendedProjects.length) { alert("Create or join a project first."); return; }
    inviteUserToProject(githubId, recommendedProjects[0]._id, token)
      .then(() => setInvitedIds((prev) => [...prev, githubId]))
      .catch(console.error);
  };

  return (
    <div className="rec-page-wrap">
      <Sidebar activePage="recommendations" />
      <div className="rec-main">

        {/* ── header ── */}
        <div className="rec-top-bar">
          <div className="rec-top-left">
            <h1 className="rec-page-title">Recommendations</h1>
            <p className="rec-page-subtitle">Projects and developers matched to your skills</p>
          </div>
        </div>

        {/* ── tabs ── */}
        <div className="rec-body">
          <div className="rec-tabs-row">
            <button className={`rec-tab ${activeTab === "projects" ? "rec-tab-active" : ""}`} onClick={() => setActiveTab("projects")}>
              🚀 Projects
            </button>
            <button className={`rec-tab ${activeTab === "developers" ? "rec-tab-active" : ""}`} onClick={() => setActiveTab("developers")}>
              👥 Developers
            </button>
          </div>

          {/* ── projects tab ── */}
          {activeTab === "projects" && (
            loadingProjects ? (
              <p className="rec-empty-msg">Loading recommendations...</p>
            ) : recommendedProjects.length === 0 ? (
              <p className="rec-empty-msg">No recommendations yet — add some skills to your profile.</p>
            ) : (
              <div className="rec-grid">
                {recommendedProjects.slice(0, 6).map((project) => (
                  <div key={project._id} className="rec-project-card">
                    <div className="rec-card-banner">
                      <div className="rec-card-avatar" />
                      <span className="rec-match-pill">{Math.round(project.match_score)}% match</span>
                    </div>
                    <div className="rec-card-body">
                      <span className="rec-card-title">{project.title}</span>
                      <span className="rec-card-desc">{project.description}</span>
                      <div className="rec-tags">
                        {project.required_skills?.slice(0, 3).map((skill) => (
                          <span key={skill} className="rec-tag">{skill}</span>
                        ))}
                      </div>
                      <div className="rec-card-meta">
                        <span className="rec-meta-text">👥 {project.members?.length || 0}/{project.team_size || "?"} members</span>
                      </div>
                    </div>
                    <div className="rec-card-actions">
                      <button className="rec-btn-outline" onClick={() => navigate(`/projects/${project._id}`)}>View</button>
                      <button
                        className={`rec-btn-primary ${joinedIds.includes(project._id) ? "rec-btn-done" : ""}`}
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
          )}

          {/* ── developers tab ── */}
          {activeTab === "developers" && (
            loadingDevs ? (
              <p className="rec-empty-msg">Loading developers...</p>
            ) : recommendedDevelopers.length === 0 ? (
              <p className="rec-empty-msg">No developer matches yet — add some skills to your profile.</p>
            ) : (
              <div className="rec-grid">
                {recommendedDevelopers.slice(0, 6).map((dev) => (
                  <div key={dev.github_id} className="rec-dev-card">
                    <div className="rec-dev-top">
                      <div className="rec-dev-avatar">{dev.username.charAt(0).toUpperCase()}</div>
                      <div className="rec-dev-info">
                        <span className="rec-dev-name">{dev.username}</span>
                        <span className="rec-dev-role">{dev.intent}</span>
                      </div>
                      <span className="rec-match-pill">{dev.match_score}%</span>
                    </div>
                    <div className="rec-tags">
                      {dev.skills.map((skill) => (
                        <span key={skill} className="rec-tag">{skill}</span>
                      ))}
                    </div>
                    <div className="rec-card-meta">
                      <span className="rec-meta-text">📦 {dev.public_repos} public repos</span>
                    </div>
                    <div className="rec-card-actions">
                      <button className="rec-btn-outline" onClick={() => navigate(`/profile/${dev.username}`)}>Profile</button>
                      <button
                        className={`rec-btn-primary ${connectedIds.includes(dev.github_id) ? "rec-btn-done" : ""}`}
                        onClick={() => toggleConnect(dev.github_id)}
                      >
                        {connectedIds.includes(dev.github_id) ? "Connected ✓" : "Connect"}
                      </button>
                      <button
                        className={`rec-btn-outline ${invitedIds.includes(dev.github_id) ? "rec-btn-done-outline" : ""}`}
                        disabled={invitedIds.includes(dev.github_id)}
                        onClick={() => handleInvite(dev.github_id)}
                      >
                        {invitedIds.includes(dev.github_id) ? "Invited ✓" : "Invite"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Recommendations;