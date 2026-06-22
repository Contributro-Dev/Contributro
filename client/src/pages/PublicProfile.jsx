import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicProfile } from "../services/userService.js";
import {
  FiMapPin, FiLink, FiCalendar, FiShare2, FiCode,
  FiAlertCircle, FiUserPlus, FiPlusCircle, FiStar,
  FiGitPullRequest, FiEye, FiGitCommit, FiBook,
} from "react-icons/fi";
import { FaAws } from "react-icons/fa";
import {
  SiPython, SiReact, SiMongodb, SiDocker, SiPandas, SiNumpy, SiTailwindcss,
} from "react-icons/si";
import "./Profile.css";
import "./PublicProfile.css";

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

const RECENT_ACTIVITY = [
  { time: "Today", text: "Updated skills", icon: FiCode, color: "#6366f1" },
  { time: "Yesterday", text: "Joined Healthcare Chatbot", icon: FiUserPlus, color: "#10b981" },
  { time: "2 days ago", text: "Created AI Resume Builder", icon: FiPlusCircle, color: "#8b5cf6" },
  { time: "4 days ago", text: "Received a recommendation", icon: FiStar, color: "#f59e0b" },
];

const ACHIEVEMENTS = [
  { emoji: "🏆", title: "Top Contributor", desc: "Recognized for outstanding contributions", bg: "#fffbeb" },
  { emoji: "🔥", title: "30 Day Streak", desc: "Shipped something every day for a month", bg: "#fff7ed" },
  { emoji: "🚀", title: "Creator", desc: "Launched 4+ projects on Contributro", bg: "#f5f3ff" },
  { emoji: "🛡️", title: "Open Source Hero", desc: "Helping developers worldwide", bg: "#eff6ff" },
];

const CURRENT_MONTH = new Date().toLocaleString("default", { month: "long", year: "numeric" });

const MONTH_LABELS = (() => {
  const labels = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push({ label: d.toLocaleString("default", { month: "short" }), col: Math.round((11 - i) * 4.3) + 1 });
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

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    getPublicProfile(username)
      .then((res) => { setProfile(res.data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast("Profile link copied to clipboard!");
    } catch {
      showToast("Failed to copy link.", "error");
    }
  };

  if (loading) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-notfound">
          <FiAlertCircle size={40} color="#6366f1" />
          <h2>Profile not found</h2>
          <p>The user <strong>@{username}</strong> does not exist on Contributro.</p>
          <Link to="/" className="btn btn--primary" style={{ marginTop: "16px", display: "inline-flex", gap: "6px" }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const firstLetter = profile.username?.charAt(0).toUpperCase() || "U";

  return (
    <div className="public-profile-page">
      {toast && (
        <div className={`profile-toast profile-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="public-profile-topbar">
        <Link to="/" className="public-profile-brand">Contributro</Link>
        <Link to="/login" className="btn btn--primary" style={{ fontSize: "13px", padding: "7px 16px" }}>
          Sign in
        </Link>
      </div>

      <div className="profile-layout public-profile-layout">
        <div className="profile-center">
          <section className="card profile-header-card">
            <div className="profile-header-left">
              <div className="profile-avatar">
                {profile.avatar
                  ? <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  : firstLetter}
              </div>
              <div className="profile-header-info">
                <div className="profile-name-row">
                  <h1 className="profile-name">{profile.name || profile.username}</h1>
                  {profile.status && <span className="badge badge--green">{profile.status}</span>}
                </div>
                <p className="profile-username">@{profile.username}</p>
                <div className="profile-meta">
                  {profile.location && (
                    <span className="meta-item"><FiMapPin size={14} /> {profile.location}</span>
                  )}
                  {(profile.portfolio || profile.website) && (
                    <span className="meta-item">
                      <FiLink size={14} />
                      <a href={profile.portfolio || profile.website} target="_blank" rel="noreferrer">
                        {profile.portfolio || profile.website}
                      </a>
                    </span>
                  )}
                  {profile.joinedDate && (
                    <span className="meta-item"><FiCalendar size={14} /> Joined {profile.joinedDate}</span>
                  )}
                </div>
                <p className="profile-bio">
                  {profile.bio || "Passionate about AI, open source and building impactful products."}
                </p>
                <div className="profile-actions">
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
                <span className="contribution-stat__value">—</span>
                <span className="contribution-stat__label">Total Contributions</span>
              </div>
              <div className="contribution-stat">
                <span className="contribution-stat__value">— days</span>
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
                    {Array.from({ length: 52 }).map((_, wIdx) => (
                      <div key={wIdx} className="heatmap-column">
                        {Array.from({ length: 7 }).map((_, dIdx) => (
                          <div key={dIdx} className="heatmap-cell" style={{ backgroundColor: LEVEL_COLORS[0] }} />
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
            <div className="timeline">
              {RECENT_ACTIVITY.map((activity, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-marker">
                    <span className="timeline-icon" style={{ color: activity.color }}>
                      <activity.icon size={14} />
                    </span>
                    {i < RECENT_ACTIVITY.length - 1 && <span className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-time">{activity.time}</p>
                    <p className="timeline-text">{activity.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="profile-right">
          <section className="card">
            <h3 className="section-title section-title--sm">Top Languages</h3>
            <div className="languages-list">
              <p className="empty-msg">Sign in to view language data.</p>
            </div>
          </section>

          <section className="card">
            <h3 className="section-title section-title--sm">GitHub Stats</h3>
            <div className="github-stats-list">
              <div className="github-stat-row">
                <span className="github-stat-row__label"><FiBook size={15} /> Repositories</span>
                <span className="github-stat-row__value">—</span>
              </div>
              <div className="github-stat-row">
                <span className="github-stat-row__label"><FiGitCommit size={15} /> Commits</span>
                <span className="github-stat-row__value">—</span>
              </div>
              <div className="github-stat-row">
                <span className="github-stat-row__label"><FiGitPullRequest size={15} /> Pull Requests</span>
                <span className="github-stat-row__value">—</span>
              </div>
              <div className="github-stat-row">
                <span className="github-stat-row__label"><FiAlertCircle size={15} /> Issues</span>
                <span className="github-stat-row__value">—</span>
              </div>
              <div className="github-stat-row">
                <span className="github-stat-row__label"><FiEye size={15} /> Followers</span>
                <span className="github-stat-row__value">—</span>
              </div>
              <div className="github-stat-row">
                <span className="github-stat-row__label"><FiUserPlus size={15} /> Following</span>
                <span className="github-stat-row__value">—</span>
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
  );
}