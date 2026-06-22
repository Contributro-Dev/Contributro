import { useContext, useState, useEffect, useCallback } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import EditProfileModal from "../components/EditProfileModal.jsx";
import { getMyConnections } from "../services/connectionServices.js";
import { getUsersByIds } from "../services/userService.js"; // alongside your other userService imports
import {
  getGithubContributions,
  getGithubStats,
  getGithubLanguages,
  getMyActivity,
  getMe,
  updateMe,
} from "../services/userService.js";
import {
  FiMapPin, FiLink, FiCalendar, FiEdit2, FiShare2, FiCode,
  FiUserPlus, FiActivity, FiGitPullRequest,
  FiAlertCircle, FiEye, FiGitCommit, FiBook, FiStar,
  FiUser, FiBookmark, FiPlusCircle,
} from "react-icons/fi";
import { FaAws } from "react-icons/fa";
import {
  SiPython, SiReact, SiMongodb, SiDocker, SiPandas, SiNumpy, SiTailwindcss,
} from "react-icons/si";
import "./Profile.css";

const TECH_STACK = [
  { name: "Python", icon: SiPython, color: "#3776AB" },
  { name: "React", icon: SiReact, color: "#06B6D4" },
  { name: "MongoDB", icon: SiMongodb, color: "#10B981" },
  { name: "Machine Learning", icon: FiCode, color: "#8B5CF6" },
  { name: "Docker", icon: SiDocker, color: "#0EA5E9" },
  { name: "AWS", icon: FaAws, color: "#F59E0B" },
  { name: "Pandas", icon: SiPandas, color: "#7C3AED" },
  { name: "NumPy", icon: SiNumpy, color: "#2563EB" },
  { name: "Tailwind CSS", icon: SiTailwindcss, color: "#14B8A6" },
];

const INTERESTS = [
  { label: "AI/ML", emoji: "🤖", bg: "#f5f3ff" },
  { label: "Data Science", emoji: "📊", bg: "#ecfdf5" },
  { label: "Open Source", emoji: "🌐", bg: "#eef2ff" },
  { label: "EdTech", emoji: "🎓", bg: "#eff6ff" },
  { label: "Cloud Computing", emoji: "☁️", bg: "#f0f9ff" },
  { label: "UI/UX", emoji: "🎨", bg: "#fdf2f8" },
];

const ACHIEVEMENTS = [
  { emoji: "🏆", title: "Top Contributor", desc: "Recognized for outstanding contributions", bg: "#fffbeb" },
  { emoji: "🔥", title: "30 Day Streak", desc: "Shipped something every day for a month", bg: "#fff7ed" },
  { emoji: "🚀", title: "Creator", desc: "Launched 4+ projects on Contributro", bg: "#f5f3ff" },
  { emoji: "🛡️", title: "Open Source Hero", desc: "Helping developers worldwide", bg: "#eff6ff" },
];

const ACTIVITY_ICON_MAP = {
  updated_profile:    { icon: FiUser,       color: "#6366f1" },
  updated_skills:     { icon: FiCode,       color: "#8b5cf6" },
  updated_bio:        { icon: FiEdit2,      color: "#6366f1" },
  updated_portfolio:  { icon: FiLink,       color: "#0ea5e9" },
  changed_status:     { icon: FiActivity,   color: "#f59e0b" },
  shared_profile:     { icon: FiShare2,     color: "#10b981" },
  connected_github:   { icon: FiGitCommit,  color: "#1d4ed8" },
  created_project:    { icon: FiPlusCircle, color: "#8b5cf6" },
  joined_project:     { icon: FiUserPlus,   color: "#10b981" },
  bookmarked_project: { icon: FiBookmark,   color: "#f59e0b" },
  default:            { icon: FiStar,       color: "#6366f1" },
};

const CURRENT_MONTH = new Date().toLocaleString("default", { month: "long", year: "numeric" });


// then render connections.length or map over IDs (you'll want a /users/by-ids route to resolve usernames)
const MONTH_LABELS = (() => {
  const labels = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push({
      label: d.toLocaleString("default", { month: "short" }),
      col: Math.round((11 - i) * 4.3) + 1,
    });
  }
  return labels;
})();

const LEVEL_COLORS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

function getLevel(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function getRelativeTime(isoString) {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

export default function Profile() {
  const { user, token, logout, updateUser } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [contributions, setContributions] = useState({ weeks: [], total: 0, streak: 0 });
  const [githubStats, setGithubStats] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [toast, setToast] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);

  const [connections, setConnections] = useState([]);
  useEffect(() => {
    if (!token) return;
    getMyConnections(token).then(res => setConnections(res.data.connected_ids));

}, [token]);
  useEffect(() => {
  if (!token) return;
  getMyConnections(token)
    .then((res) => {
      const ids = res.data.connected_ids || [];
      if (ids.length === 0) {
        setConnections([]);
        return;
      }
      return getUsersByIds(token, ids).then((res2) => setConnections(res2.data));
    })
    .catch((err) => console.error("Failed to load connections:", err));
}, [token]);


  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refreshActivity = useCallback(() => {
    if (!token) return;
    getMyActivity(token)
      .then((res) => setActivity(res.data))
      .catch((err) => console.error("Failed to load activity:", err));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    getGithubContributions(token)
      .then((res) => setContributions({ weeks: res.data.weeks, total: res.data.total_contributions, streak: res.data.current_streak }))
      .catch((err) => console.error("Failed to load contributions:", err));

    getGithubStats(token)
      .then((res) => setGithubStats(res.data))
      .catch((err) => console.error("Failed to load GitHub stats:", err));

    getGithubLanguages(token)
      .then((res) => setLanguages(res.data.languages))
      .catch((err) => console.error("Failed to load languages:", err));

    refreshActivity();
  }, [token, refreshActivity]);

  const handleOpenEditModal = useCallback(async () => {
    try {
      const res = await getMe(token);
      setModalInitialData(res.data);
      setShowEditModal(true);
    } catch (err) {
      console.error("Failed to fetch latest profile:", err);
      setModalInitialData({ ...user });
      setShowEditModal(true);
    }
  }, [token, user]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setModalInitialData(null);
    setEditLoading(false);
  }, []);

  const handleSaveProfile = useCallback(async (formData) => {
    setEditLoading(true);
    try {
      const res = await updateMe(token, formData);
      updateUser(res.data);
      setShowEditModal(false);
      setModalInitialData(null);
      showToast("Profile updated successfully!");
      refreshActivity();
    } catch (err) {
      console.error("Failed to update profile:", err);
      showToast("Failed to update profile. Please try again.", "error");
    } finally {
      setEditLoading(false);
    }
  }, [token, updateUser, showToast, refreshActivity]);

  const handleShareProfile = useCallback(async () => {
    const profileUrl = `${window.location.origin}/profile/${user?.username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast("Profile link copied to clipboard!");
    } catch {
      showToast("Failed to copy link.", "error");
    }
  }, [user?.username, showToast]);

  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <Sidebar activePage="profile" />
      <div className="profile-container">

        {toast && (
          <div className={`profile-toast profile-toast--${toast.type}`}>
            {toast.message}
          </div>
        )}

        {showEditModal && modalInitialData && (
          <EditProfileModal
            key={Date.now()}
            initialData={modalInitialData}
            onSave={handleSaveProfile}
            onClose={handleCloseEditModal}
            loading={editLoading}
          />
        )}

        <div className="profile-nav">
          <div className="search-bar">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search projects, skills, or users..." />
          </div>
          <div className="nav-right">
            <button className="theme-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" /><path d="M12 20v2" />
                <path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" />
                <path d="M2 12h2" /><path d="M20 12h2" />
                <path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" />
              </svg>
            </button>
            <button className="notifications">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="profile-section" onClick={() => setShowProfileMenu((p) => !p)}>
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

        <div className="profile-layout">
          <div className="profile-center">

            <section className="card profile-header-card">
              <div className="profile-header-left">
                <div className="profile-avatar">
                  {user?.avatar
                    ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    : firstLetter}
                </div>
                <div className="profile-header-info">
                  <div className="profile-name-row">
                    <h1 className="profile-name">{user?.name || user?.username || "Developer"}</h1>
                    <span className="badge badge--green">{user?.status || "Looking for Projects"}</span>
                  </div>
                  <p className="profile-username">@{user?.username || "username"}</p>
                  <div className="profile-meta">
                    <span className="meta-item"><FiMapPin size={14} /> {user?.location || "India"}</span>
                    <span className="meta-item">
                      <FiLink size={14} />
                      {user?.portfolio || user?.website
                        ? <a href={user.portfolio || user.website} target="_blank" rel="noreferrer">{user.portfolio || user.website}</a>
                        : "yourportfolio.dev"}
                    </span>
                    <span className="meta-item"><FiCalendar size={14} /> Joined {user?.joinedDate || "Jan 2024"}</span>
                  </div>
                  <p className="profile-bio">{user?.bio || "Passionate about AI, open source and building impactful products."}</p>
                  <div className="profile-actions">
                    <button className="btn btn--primary" onClick={handleOpenEditModal}>
                      <FiEdit2 size={15} /> Edit Profile
                    </button>
                    <button className="btn btn--outline" onClick={handleShareProfile}>
                      <FiShare2 size={15} /> Share Profile
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="section-title">Tech Stack</h2>
              <div className="pill-list">
                {TECH_STACK.map((tech) => (
                  <span key={tech.name} className="tech-pill">
                    <tech.icon style={{ color: tech.color }} size={15} />
                    {tech.name}
                  </span>
                ))}
              </div>
            </section>

            <section className="card">
              <h2 className="section-title">Interests</h2>
              <div className="interests-grid">
                {INTERESTS.map((interest) => (
                  <div key={interest.label} className="interest-card" style={{ backgroundColor: interest.bg }}>
                    <span className="interest-emoji">{interest.emoji}</span>
                    <span className="interest-label">{interest.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="section-header">
                <h2 className="section-title">GitHub Contributions</h2>
                <span className="contribution-month">{CURRENT_MONTH}</span>
              </div>
              <div className="contribution-summary">
                <div className="contribution-stat">
                  <span className="contribution-stat__value">{contributions.total}</span>
                  <span className="contribution-stat__label">Total Contributions</span>
                </div>
                <div className="contribution-stat">
                  <span className="contribution-stat__value">{contributions.streak} days</span>
                  <span className="contribution-stat__label">Current Streak</span>
                </div>
              </div>
              <div className="heatmap-wrapper">
                <div className="heatmap-inner">
                  <div className="heatmap-months">
                    {MONTH_LABELS.map((m, i) => (
                      <span key={i} className="heatmap-month-label" style={{ gridColumnStart: m.col }}>{m.label}</span>
                    ))}
                  </div>
                  <div className="heatmap-body">
                    <div className="heatmap-day-labels">
                      <span>Mon</span><span>Wed</span><span>Fri</span>
                    </div>
                    <div className="heatmap-grid">
                      {contributions.weeks.map((week, wIdx) => (
                        <div key={wIdx} className="heatmap-column">
                          {week.map((count, dIdx) => (
                            <div key={dIdx} className="heatmap-cell"
                              style={{ backgroundColor: LEVEL_COLORS[getLevel(count)] }}
                              title={`${count} contributions`} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="heatmap-legend">
                <span>Less</span>
                {LEVEL_COLORS.map((color, i) => (
                  <span key={i} className="legend-box" style={{ backgroundColor: color }} />
                ))}
                <span>More</span>
              </div>
            </section>

            <section className="card">
              <h2 className="section-title">Recent Activity</h2>
              {activity.length === 0 ? (
                <p className="empty-msg">No recent activity yet.</p>
              ) : (
                <div className="timeline">
                  {activity.map((item, i) => {
                    const mapped = ACTIVITY_ICON_MAP[item.type] || ACTIVITY_ICON_MAP.default;
                    const IconComponent = mapped.icon;
                    return (
                      <div key={i} className="timeline-item">
                        <div className="timeline-marker">
                          <span className="timeline-icon" style={{ color: mapped.color }}>
                            <IconComponent size={14} />
                          </span>
                          {i < activity.length - 1 && <span className="timeline-line" />}
                        </div>
                        <div className="timeline-content">
                          <p className="timeline-time">{getRelativeTime(item.created_at)}</p>
                          <p className="timeline-text">{item.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>

          <div className="profile-right">
            <section className="card">
              <h3 className="section-title section-title--sm">Top Languages</h3>
              <div className="languages-list">
                {languages.length === 0 ? (
                  <p className="empty-msg">No language data yet.</p>
                ) : (
                  languages.map((lang) => (
                    <div key={lang.name} className="language-item">
                      <div className="language-item__row">
                        <span className="language-item__name">{lang.name}</span>
                        <span className="language-item__percent">{lang.percent}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${lang.percent}%`, backgroundColor: lang.color }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          <section className="card">
  <h3 className="section-title section-title--sm">Connections ({connections.length})</h3>
  {connections.length === 0 ? (
    <p className="empty-msg">No connections yet.</p>
  ) : (
    <div className="languages-list">
      {connections.map((c) => (
        <div key={c.github_id} className="language-item" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="profile-pic" style={{ width: "32px", height: "32px", fontSize: "13px" }}>
            {c.avatar
              ? <img src={c.avatar} alt={c.username} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : (c.username?.charAt(0).toUpperCase() || "U")}
          </div>
          <span className="language-item__name">{c.name || c.username}</span>
        </div>
      ))}
    </div>
  )}
</section>


            <section className="card">
              <h3 className="section-title section-title--sm">GitHub Stats</h3>
              <div className="github-stats-list">
                <div className="github-stat-row">
                  <span className="github-stat-row__label"><FiBook size={15} /> Repositories</span>
                  <span className="github-stat-row__value">{githubStats?.repositories ?? "—"}</span>
                </div>
                <div className="github-stat-row">
                  <span className="github-stat-row__label"><FiGitCommit size={15} /> Commits</span>
                  <span className="github-stat-row__value">{githubStats?.commits ?? "—"}</span>
                </div>
                <div className="github-stat-row">
                  <span className="github-stat-row__label"><FiGitPullRequest size={15} /> Pull Requests</span>
                  <span className="github-stat-row__value">{githubStats?.pull_requests ?? "—"}</span>
                </div>
                <div className="github-stat-row">
                  <span className="github-stat-row__label"><FiAlertCircle size={15} /> Issues</span>
                  <span className="github-stat-row__value">{githubStats?.issues ?? "—"}</span>
                </div>
                <div className="github-stat-row">
                  <span className="github-stat-row__label"><FiEye size={15} /> Followers</span>
                  <span className="github-stat-row__value">{githubStats?.followers ?? "—"}</span>
                </div>
                <div className="github-stat-row">
                  <span className="github-stat-row__label"><FiUserPlus size={15} /> Following</span>
                  <span className="github-stat-row__value">{githubStats?.following ?? "—"}</span>
                </div>
              </div>
            </section>

            <section className="card">
              <h3 className="section-title section-title--sm">Achievements</h3>
              <div className="achievements-list">
                {ACHIEVEMENTS.map((badge) => (
                  <div key={badge.title} className="achievement-item">
                    <span className="achievement-icon" style={{ backgroundColor: badge.bg }}>{badge.emoji}</span>
                    <div className="achievement-text">
                      <p className="achievement-title">{badge.title}</p>
                      <p className="achievement-desc">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}