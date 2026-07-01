// client/src/pages/Discussions.jsx
import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { getProject } from "../services/projectServices.js";
import {
  getDiscussions, createDiscussion, getDiscussion,
  addReply, likeDiscussion, likeReply, acceptReply,
  pinDiscussion, deleteDiscussion,
} from "../services/discussionServices.js";
import Sidebar from "../components/Sidebar.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { FiMoon, FiSun, FiSearch, FiPlus, FiX, FiThumbsUp, FiCheck, FiMoreVertical } from "react-icons/fi";
import "./Discussions.css";

const CATEGORY_COLORS = {
  General: { bg: "#ede9fe", color: "#7c3aed" },
  Backend:  { bg: "#dbeafe", color: "#2563eb" },
  Frontend: { bg: "#dcfce7", color: "#16a34a" },
  Bug:      { bg: "#fee2e2", color: "#dc2626" },
  Feature:  { bg: "#fef3c7", color: "#d97706" },
  Other:    { bg: "#f3f4f6", color: "#6b7280" },
};

const STATUS_STYLE = {
  open:     { bg: "#dcfce7", color: "#16a34a", label: "Open" },
  answered: { bg: "#dbeafe", color: "#2563eb", label: "Answered" },
};

function timeAgo(dateStr) {
  const secs = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ username, avatar, size = 32 }) {
  if (avatar) return (
    <img src={avatar} alt={username}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  );
  return (
    <div className="disc-avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {username?.charAt(0).toUpperCase() || "U"}
    </div>
  );
}

export default function Discussions() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  const [project, setProject] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeThread, setActiveThread] = useState(null); // { discussion, replies }
  const [threadLoading, setThreadLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // new discussion modal
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", body: "", category: "General" });
  const [creating, setCreating] = useState(false);

  // reply
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const replyRef = useRef(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { logout } = useContext(AuthContext);
  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

  // load project + discussions
  useEffect(() => {
    if (!token) return;
    getProject(projectId, token).then(r => setProject(r.data)).catch(console.error);
    getDiscussions(projectId, token)
      .then(r => { setDiscussions(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId, token]);

  // load thread when activeId changes
  useEffect(() => {
    if (!activeId || !token) return;
    setThreadLoading(true);
    getDiscussion(projectId, activeId, token)
      .then(r => { setActiveThread(r.data); setThreadLoading(false); })
      .catch(() => setThreadLoading(false));
  }, [activeId, projectId, token]);

  // auto scroll replies to bottom
  useEffect(() => {
    if (replyRef.current) replyRef.current.scrollTop = replyRef.current.scrollHeight;
  }, [activeThread?.replies]);

  const isOwner = project && String(project.owner_github_id) === String(user?.github_id);

  const filteredDiscussions = discussions.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    if (filter === "open") return matchSearch && d.status === "open";
    if (filter === "answered") return matchSearch && d.status === "answered";
    if (filter === "pinned") return matchSearch && d.pinned;
    if (filter === "mine") return matchSearch && String(d.author_id) === String(user?.github_id);
    return matchSearch;
  });

  const handleCreate = async () => {
    if (!newForm.title.trim()) return;
    setCreating(true);
    try {
      const res = await createDiscussion(projectId, newForm, token);
      setDiscussions(prev => [res.data, ...prev]);
      setShowNew(false);
      setNewForm({ title: "", body: "", category: "General" });
      setActiveId(res.data.id);
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !activeId) return;
    setReplying(true);
    try {
      const res = await addReply(projectId, activeId, replyText, token);
      setActiveThread(prev => ({ ...prev, replies: [...(prev.replies || []), res.data] }));
      setReplyText("");
      // update reply count in list
      setDiscussions(prev => prev.map(d =>
        d.id === activeId ? { ...d, reply_count: d.reply_count + 1 } : d
      ));
    } catch (err) { console.error(err); }
    finally { setReplying(false); }
  };

  const handleLikeDiscussion = async (discId) => {
    try {
      const res = await likeDiscussion(discId, token);
      setDiscussions(prev => prev.map(d =>
        d.id === discId ? { ...d, likes: res.data.likes, liked_by_me: res.data.liked } : d
      ));
      if (activeThread?.discussion?.id === discId) {
        setActiveThread(prev => ({
          ...prev,
          discussion: { ...prev.discussion, likes: res.data.likes, liked_by_me: res.data.liked }
        }));
      }
    } catch (err) { console.error(err); }
  };

  const handleLikeReply = async (replyId) => {
    try {
      const res = await likeReply(replyId, token);
      setActiveThread(prev => ({
        ...prev,
        replies: prev.replies.map(r =>
          r.id === replyId ? { ...r, likes: res.data.likes, liked_by_me: res.data.liked } : r
        )
      }));
    } catch (err) { console.error(err); }
  };

  const handleAccept = async (replyId) => {
    try {
      await acceptReply(activeId, replyId, token);
      setActiveThread(prev => ({
        ...prev,
        discussion: { ...prev.discussion, status: "answered" },
        replies: prev.replies.map(r => ({ ...r, is_accepted: r.id === replyId }))
      }));
      setDiscussions(prev => prev.map(d =>
        d.id === activeId ? { ...d, status: "answered" } : d
      ));
    } catch (err) { console.error(err); }
  };

  const handlePin = async (discId) => {
    try {
      const res = await pinDiscussion(discId, token);
      setDiscussions(prev => prev.map(d =>
        d.id === discId ? { ...d, pinned: res.data.pinned } : d
      ));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (discId) => {
    if (!window.confirm("Delete this discussion?")) return;
    try {
      await deleteDiscussion(discId, token);
      setDiscussions(prev => prev.filter(d => d.id !== discId));
      if (activeId === discId) { setActiveId(null); setActiveThread(null); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="disc-page-wrap">
      <Sidebar activePage="" />
      <div className="disc-main">

        {/* nav */}
        <div className="disc-nav">
          <div className="search-bar" style={{ width: 480 }}>
            <FiSearch size={16} color="var(--text-secondary)" />
            <input type="text" placeholder="Search projects, skills, technologies..."
              style={{ outline: "none", background: "transparent", color: "var(--text)", width: "100%", border: "none" }} />
          </div>
          <div className="nav-right">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            <button className="notifications">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="profile-section" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="profile-pic">
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  : firstLetter}
              </div>
              <span>{user?.name || user?.username || "User"}</span>
              {showProfileMenu && (
                <div className="profile-dropdown" onClick={e => e.stopPropagation()}>
                  <a href="/profile">My Profile</a>
                  <a href="/settings">Settings</a>
                  <button className="logout-btn" onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="disc-body">
          {/* ── page header ── */}
          <div className="disc-page-header">
            <div className="disc-page-header-left">
              <button className="disc-back-btn" onClick={() => navigate(`/projects/${projectId}`)}>
                ← Back to Project
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                <div className="disc-page-icon">💬</div>
                <div>
                  <h1 className="disc-page-title">Discussions</h1>
                  <p className="disc-page-subtitle">Collaborate, ask questions, share ideas, and make project decisions.</p>
                </div>
              </div>
            </div>
            <button className="disc-new-btn" onClick={() => setShowNew(true)}>
              <FiPlus size={15} /> New Discussion
            </button>
          </div>

          {/* ── filters ── */}
          <div className="disc-filter-bar">
            <div className="disc-search-box">
              <FiSearch size={14} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="disc-filter-tabs">
              {["all","open","answered","pinned","mine"].map(f => (
                <button
                  key={f}
                  className={`disc-filter-tab ${filter === f ? "disc-filter-tab-active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "mine" ? "My Discussions" : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "all" && <span className="disc-filter-count">{discussions.length}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* ── two panel ── */}
          <div className="disc-panels">
            {/* left: list */}
            <div className="disc-list-panel">
              {loading && <p className="disc-empty">Loading discussions...</p>}
              {!loading && filteredDiscussions.length === 0 && (
                <p className="disc-empty">No discussions yet — start one!</p>
              )}
              {filteredDiscussions.map(d => {
                const cat = CATEGORY_COLORS[d.category] || CATEGORY_COLORS.Other;
                const st = STATUS_STYLE[d.status] || STATUS_STYLE.open;
                const isActive = activeId === d.id;
                return (
                  <div
                    key={d.id}
                    className={`disc-list-item ${isActive ? "disc-list-item-active" : ""}`}
                    onClick={() => setActiveId(d.id)}
                  >
                    <div className="disc-list-item-top">
                      <span className="disc-category-badge" style={{ background: cat.bg, color: cat.color }}>
                        # {d.category}
                      </span>
                      <span className="disc-status-badge" style={{ background: st.bg, color: st.color }}>
                        {d.status === "answered" ? "✓ " : ""}{st.label}
                      </span>
                      {d.pinned && <span className="disc-pin-badge">📌</span>}
                    </div>
                    <div className="disc-list-item-title">{d.title}</div>
                    <div className="disc-list-item-preview">{d.body?.slice(0, 80)}{d.body?.length > 80 ? "..." : ""}</div>
                    <div className="disc-list-item-meta">
                      <Avatar username={d.author_username} avatar={d.author_avatar} size={20} />
                      <span className="disc-meta-author">{d.author_username}</span>
                      <span className="disc-meta-time">{timeAgo(d.created_at)}</span>
                      <span className="disc-meta-replies">💬 {d.reply_count}</span>
                    </div>
                  </div>
                );
              })}
              {!loading && (
                <p className="disc-list-footer">Showing {filteredDiscussions.length} of {discussions.length} discussions</p>
              )}
            </div>

            {/* right: thread */}
            <div className="disc-thread-panel">
              {!activeId && (
                <div className="disc-thread-empty">
                  <div className="disc-thread-empty-icon">💬</div>
                  <p>Select a discussion to view the thread</p>
                </div>
              )}
              {activeId && threadLoading && (
                <div className="disc-thread-empty"><p>Loading thread...</p></div>
              )}
              {activeId && !threadLoading && activeThread && (() => {
                const { discussion: disc, replies } = activeThread;
                const cat = CATEGORY_COLORS[disc.category] || CATEGORY_COLORS.Other;
                const st = STATUS_STYLE[disc.status] || STATUS_STYLE.open;
                const isDiscAuthor = String(disc.author_id) === String(user?.github_id);

                return (
                  <>
                    {/* thread header */}
                    <div className="disc-thread-header">
                      <div className="disc-thread-header-top">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span className="disc-category-badge" style={{ background: cat.bg, color: cat.color }}>
                            # {disc.category}
                          </span>
                          <span className="disc-status-badge" style={{ background: st.bg, color: st.color }}>
                            {disc.status === "answered" ? "✓ Answered" : "Open"}
                          </span>
                          {disc.pinned && <span className="disc-pin-badge">📌 Pinned</span>}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {isOwner && (
                            <button className="disc-icon-btn" title="Pin/Unpin" onClick={() => handlePin(disc.id)}>
                              📌
                            </button>
                          )}
                          {(isDiscAuthor || isOwner) && (
                            <button className="disc-icon-btn disc-icon-btn-danger" title="Delete" onClick={() => handleDelete(disc.id)}>
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                      <h2 className="disc-thread-title">{disc.title}</h2>
                      <div className="disc-thread-author-row">
                        <Avatar username={disc.author_username} avatar={disc.author_avatar} size={28} />
                        <span className="disc-thread-author">{disc.author_username}</span>
                        <span className="disc-meta-time">{timeAgo(disc.created_at)}</span>
                        <span className="disc-meta-replies">· {replies.length} replies</span>
                      </div>
                    </div>

                    {/* original post body */}
                    <div className="disc-original-body">
                      <p>{disc.body}</p>
                      <div className="disc-reply-actions">
                        <button
                          className={`disc-like-btn ${disc.liked_by_me ? "disc-like-btn-active" : ""}`}
                          onClick={() => handleLikeDiscussion(disc.id)}
                        >
                          <FiThumbsUp size={13} /> {disc.likes}
                        </button>
                      </div>
                    </div>

                    {/* replies */}
                    <div className="disc-replies" ref={replyRef}>
                      {replies.map(r => (
                        <div key={r.id} className={`disc-reply ${r.is_accepted ? "disc-reply-accepted" : ""}`}>
                          <div className="disc-reply-header">
                            <Avatar username={r.author_username} avatar={r.author_avatar} size={28} />
                            <span className="disc-thread-author">{r.author_username}</span>
                            <span className="disc-meta-time">{timeAgo(r.created_at)}</span>
                            {r.is_accepted && (
                              <span className="disc-accepted-badge">
                                <FiCheck size={11} /> Accepted Answer
                              </span>
                            )}
                          </div>
                          <p className="disc-reply-text">{r.text}</p>
                          <div className="disc-reply-actions">
                            <button
                              className={`disc-like-btn ${r.liked_by_me ? "disc-like-btn-active" : ""}`}
                              onClick={() => handleLikeReply(r.id)}
                            >
                              <FiThumbsUp size={13} /> {r.likes}
                            </button>
                            {isDiscAuthor && !r.is_accepted && (
                              <button className="disc-accept-btn" onClick={() => handleAccept(r.id)}>
                                <FiCheck size={13} /> Accept Answer
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* reply composer */}
                    <div className="disc-composer">
                      <Avatar username={user?.username} avatar={user?.avatar} size={28} />
                      <div className="disc-composer-right">
                        <textarea
                          className="disc-composer-input"
                          placeholder="Write your reply..."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          rows={2}
                        />
                        <div className="disc-composer-footer">
                          <button
                            className="disc-reply-send-btn"
                            onClick={handleReply}
                            disabled={replying || !replyText.trim()}
                          >
                            {replying ? "Sending..." : "Reply"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── New Discussion Modal ── */}
      {showNew && (
        <div className="disc-modal-overlay" onClick={() => setShowNew(false)}>
          <div className="disc-modal" onClick={e => e.stopPropagation()}>
            <div className="disc-modal-header">
              <span className="disc-modal-title">New Discussion</span>
              <button className="disc-modal-close" onClick={() => setShowNew(false)}>
                <FiX size={16} />
              </button>
            </div>
            <div className="disc-modal-body">
              <label className="disc-modal-label">
                Category
                <select
                  className="disc-modal-input"
                  value={newForm.category}
                  onChange={e => setNewForm(p => ({ ...p, category: e.target.value }))}
                >
                  {Object.keys(CATEGORY_COLORS).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="disc-modal-label">
                Title
                <input
                  className="disc-modal-input"
                  placeholder="What do you want to discuss?"
                  value={newForm.title}
                  onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
                />
              </label>
              <label className="disc-modal-label">
                Description
                <textarea
                  className="disc-modal-input disc-modal-textarea"
                  placeholder="Provide more context..."
                  value={newForm.body}
                  onChange={e => setNewForm(p => ({ ...p, body: e.target.value }))}
                />
              </label>
            </div>
            <div className="disc-modal-footer">
              <button className="disc-modal-cancel" onClick={() => setShowNew(false)}>Cancel</button>
              <button
                className="disc-modal-submit"
                onClick={handleCreate}
                disabled={creating || !newForm.title.trim()}
              >
                {creating ? "Creating..." : "Create Discussion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}