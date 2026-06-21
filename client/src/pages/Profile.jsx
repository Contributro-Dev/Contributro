import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { getGithubContributions, getGithubStats, getGithubLanguages } from "../services/userService.js";
import {
  FiMapPin,
  FiLink,
  FiCalendar,
  FiEdit2,
  FiShare2,
  FiCode,
  FiUserPlus,
  FiPlusCircle,
  FiStar,
  FiGitBranch,
  FiGitPullRequest,
  FiAlertCircle,
  FiEye,
  FiGitCommit,
  FiBook,
} from "react-icons/fi";
import { FaAws } from "react-icons/fa";
import {
  SiPython,
  SiReact,
  SiMongodb,
  SiDocker,
  SiPandas,
  SiNumpy,
  SiTailwindcss,
} from "react-icons/si";
import "./Profile.css";

// ── Static profile content (not from GitHub) ───────────────────────────────

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

// Approximate month label positions across 52 weekly columns
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

export default function Profile() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ── Real GitHub data state ────────────────────────────────────────────────
  const [contributions, setContributions] = useState({ weeks: [], total: 0, streak: 0 });
  const [githubStats, setGithubStats] = useState(null);
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    if (!token) return;

    getGithubContributions(token)
      .then((res) => {
        setContributions({
          weeks: res.data.weeks,
          total: res.data.total_contributions,
          streak: res.data.current_streak,
        });
      })
      .catch((err) => console.error("Failed to load contributions:", err));

    getGithubStats(token)
      .then((res) => setGithubStats(res.data))
      .catch((err) => console.error("Failed to load GitHub stats:", err));

    getGithubLanguages(token)
      .then((res) => setLanguages(res.data.languages))
      .catch((err) => console.error("Failed to load languages:", err));
  }, [token]);

  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <Sidebar activePage="profile" />
      <div className="profile-container">
        {/* ── Navbar ───────────────────────────────────────────────────────── */}
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
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

        {/* ── Layout ───────────────────────────────────────────────────────── */}
        <div className="profile-layout">
          {/* ── Center column ──────────────────────────────────────────────── */}
          <div className="profile-center">
            {/* Profile header card */}
            <section className="card profile-header-card">
              <div className="profile-header-left">
                <div className="profile-avatar">{firstLetter}</div>
                <div className="profile-header-info">
                  <div className="profile-name-row">
                    <h1 className="profile-name">{user?.name || user?.username || "Developer"}</h1>
                    <span className="badge badge--green">Looking for Projects</span>
                  </div>
                  <p className="profile-username">@{user?.username || "username"}</p>

                  <div className="profile-meta">
                    <span className="meta-item">
                      <FiMapPin size={14} /> {user?.location || "India"}
                    </span>
                    <span className="meta-item">
                      <FiLink size={14} /> {user?.website || "yourportfolio.dev"}
                    </span>
                    <span className="meta-item">
                      <FiCalendar size={14} /> Joined {user?.joinedDate || "Jan 2024"}
                    </span>
                  </div>

                  <p className="profile-bio">
                    {user?.bio || "Passionate about AI, open source and building impactful products."}
                  </p>

                  <div className="profile-actions">
                    <button className="btn btn--primary">
                      <FiEdit2 size={15} /> Edit Profile
                    </button>
                    <button className="btn btn--outline">
                      <FiShare2 size={15} /> Share Profile
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Tech stack */}
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

            {/* Interests */}
            <section className="card">
              <h2 className="section-title">Interests</h2>
              <div className="interests-grid">
                {INTERESTS.map((interest) => (
                  <div
                    key={interest.label}
                    className="interest-card"
                    style={{ backgroundColor: interest.bg }}
                  >
                    <span className="interest-emoji">{interest.emoji}</span>
                    <span className="interest-label">{interest.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* GitHub Contributions heatmap — REAL DATA */}
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
                      <span key={i} className="heatmap-month-label" style={{ gridColumnStart: m.col }}>
                        {m.label}
                      </span>
                    ))}
                  </div>
                  <div className="heatmap-body">
                    <div className="heatmap-day-labels">
                      <span>Mon</span>
                      <span>Wed</span>
                      <span>Fri</span>
                    </div>
                    <div className="heatmap-grid">
                      {contributions.weeks.map((week, wIdx) => (
                        <div key={wIdx} className="heatmap-column">
                          {week.map((count, dIdx) => (
                            <div
                              key={dIdx}
                              className="heatmap-cell"
                              style={{ backgroundColor: LEVEL_COLORS[getLevel(count)] }}
                              title={`${count} contributions`}
                            />
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

            {/* Recent activity */}
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

          {/* ── Right column ───────────────────────────────────────────────── */}
          <div className="profile-right">
            {/* Top languages — REAL DATA */}
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
                        <div
                          className="progress-fill"
                          style={{ width: `${lang.percent}%`, backgroundColor: lang.color }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* GitHub stats — REAL DATA */}
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

            {/* Achievements */}
            <section className="card">
              <h3 className="section-title section-title--sm">Achievements</h3>
              <div className="achievements-list">
                {ACHIEVEMENTS.map((badge) => (
                  <div key={badge.title} className="achievement-item">
                    <span className="achievement-icon" style={{ backgroundColor: badge.bg }}>
                      {badge.emoji}
                    </span>
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