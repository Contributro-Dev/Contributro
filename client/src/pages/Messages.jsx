import { useState, useContext, useRef, useEffect, useCallback } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { getMyConnections } from "../services/connectionServices.js";
import { getUsersByIds } from "../services/userService.js";
import {
  getConversation,
  sendMessage,
  getConversationsSummary,
  uploadAttachment,
  markMessagesRead,
  deleteMessage,
} from "../services/messageServices.js";
import EmojiPicker from "emoji-picker-react";
import {
  FiSearch, FiSliders, FiPhone, FiVideo, FiInfo, FiMoreVertical,
  FiPaperclip, FiSmile, FiSend, FiFile, FiX, FiCornerUpLeft,
  FiCopy, FiTrash2, FiShare2, FiCheck,
} from "react-icons/fi";
import "./Messages.css";

// ─── helpers ────────────────────────────────────────────────────────────────
const firstLetter = (name) => name?.charAt(0).toUpperCase() || "U";
const TYPING_TIMEOUT = 3000;

function AttachmentIcon({ mime }) {
  if (!mime) return <FiFile size={20} />;
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("zip") || mime.includes("x-zip")) return "🗜️";
  if (mime.includes("word") || mime.includes("docx")) return "📝";
  return <FiFile size={20} />;
}

function TickIcon({ status }) {
  if (status === "seen")
    return <span className="tick tick-seen">
      <svg
        width="20px"
        height="20px"
        viewBox="0 -0.5 25 25"
        fill="#fff"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.03033 11.4697C4.73744 11.1768 4.26256 11.1768 3.96967 11.4697C3.67678 11.7626 3.67678 12.2374 3.96967 12.5303L5.03033 11.4697ZM8.5 16L7.96967 16.5303C8.26256 16.8232 8.73744 16.8232 9.03033 16.5303L8.5 16ZM17.0303 8.53033C17.3232 8.23744 17.3232 7.76256 17.0303 7.46967C16.7374 7.17678 16.2626 7.17678 15.9697 7.46967L17.0303 8.53033ZM9.03033 11.4697C8.73744 11.1768 8.26256 11.1768 7.96967 11.4697C7.67678 11.7626 7.67678 12.2374 7.96967 12.5303L9.03033 11.4697ZM12.5 16L11.9697 16.5303C12.2626 16.8232 12.7374 16.8232 13.0303 16.5303L12.5 16ZM21.0303 8.53033C21.3232 8.23744 21.3232 7.76256 21.0303 7.46967C20.7374 7.17678 20.2626 7.17678 19.9697 7.46967L21.0303 8.53033ZM3.96967 12.5303L7.96967 16.5303L9.03033 15.4697L5.03033 11.4697L3.96967 12.5303ZM9.03033 16.5303L17.0303 8.53033L15.9697 7.46967L7.96967 15.4697L9.03033 16.5303ZM7.96967 12.5303L11.9697 16.5303L13.0303 15.4697L9.03033 11.4697L7.96967 12.5303ZM13.0303 16.5303L21.0303 8.53033L19.9697 7.46967L11.9697 15.4697L13.0303 16.5303Z"
          fill="#fff"
        />
      </svg>
    </span>;
  if (status === "delivered")
    return <span className="tick tick-delivered">
      <svg
        width="20px"
        height="20px"
        viewBox="0 -0.5 25 25"
        fill="#fff"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.03033 11.4697C4.73744 11.1768 4.26256 11.1768 3.96967 11.4697C3.67678 11.7626 3.67678 12.2374 3.96967 12.5303L5.03033 11.4697ZM8.5 16L7.96967 16.5303C8.26256 16.8232 8.73744 16.8232 9.03033 16.5303L8.5 16ZM17.0303 8.53033C17.3232 8.23744 17.3232 7.76256 17.0303 7.46967C16.7374 7.17678 16.2626 7.17678 15.9697 7.46967L17.0303 8.53033ZM9.03033 11.4697C8.73744 11.1768 8.26256 11.1768 7.96967 11.4697C7.67678 11.7626 7.67678 12.2374 7.96967 12.5303L9.03033 11.4697ZM12.5 16L11.9697 16.5303C12.2626 16.8232 12.7374 16.8232 13.0303 16.5303L12.5 16ZM21.0303 8.53033C21.3232 8.23744 21.3232 7.76256 21.0303 7.46967C20.7374 7.17678 20.2626 7.17678 19.9697 7.46967L21.0303 8.53033ZM3.96967 12.5303L7.96967 16.5303L9.03033 15.4697L5.03033 11.4697L3.96967 12.5303ZM9.03033 16.5303L17.0303 8.53033L15.9697 7.46967L7.96967 15.4697L9.03033 16.5303ZM7.96967 12.5303L11.9697 16.5303L13.0303 15.4697L9.03033 11.4697L7.96967 12.5303ZM13.0303 16.5303L21.0303 8.53033L19.9697 7.46967L11.9697 15.4697L13.0303 16.5303Z"
          fill="#fff"
        />
      </svg>
    </span>;
  return <span className="tick tick-sent"><svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z" fill="#8696A0" />
  </svg>
  </span>;
}

// ─── component ───────────────────────────────────────────────────────────────
function Messages() {
  const { user, token } = useContext(AuthContext);

  // conversation list
  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");

  // messages
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const bodyRef = useRef(null);
  const textareaRef = useRef(null);

  // emoji picker
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef(null);

  // file / image upload
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);

  // typing indicator
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimerRef = useRef(null);

  // online status
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [lastSeen, setLastSeen] = useState({});

  // hovered message for actions
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  // sending state
  const [sending, setSending] = useState(false);

  // message being forwarded
  const [forwardMsg, setForwardMsg] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  // ── load conversations ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    getMyConnections(token)
      .then((res) => {
        const ids = res.data.connected_ids || [];
        if (ids.length === 0) { setLoadingConvos(false); return; }
        return Promise.all([
          getUsersByIds(ids, token),
          getConversationsSummary(token).catch(() => ({ data: [] })),
        ]).then(([usersRes, summaryRes]) => {
          const summaryMap = {};
          (summaryRes.data || []).forEach((s) => { summaryMap[s.other_id] = s; });
          const convos = usersRes.data.map((u) => ({
            id: u.github_id,
            name: u.name || u.username,
            username: u.username,
            avatar: u.avatar,
            last: summaryMap[u.github_id]?.last_text || "Say hello 👋",
            time: summaryMap[u.github_id]?.last_time
              ? new Date(summaryMap[u.github_id].last_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "",
            unread: summaryMap[u.github_id]?.unread_count || 0,
          }));
          setConversations(convos);

          setLoadingConvos(false);
        });
      })
      .catch((err) => { console.error(err); setLoadingConvos(false); });
  }, [token]);

  const activeConvo = conversations.find((c) => c.id === activeId);

  // ── load messages ───────────────────────────────────────────────────────
  const fetchMessages = useCallback(() => {
    if (!activeId || !token) return;
    getConversation(activeId, token)
      .then((res) => {
        const incoming = res.data.map((m) => ({
          id: m.id || m._id,
          fromMe: String(m.from_id) === String(user?.github_id),
          text: m.text || "",
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: m.status || "sent",
          attachment: m.attachment || null,
          replyTo: m.reply_to || null,
        }));

        setMessages((prev) => {
          // Only update state if something actually changed (avoids unnecessary re-renders)
          if (JSON.stringify(prev) === JSON.stringify(incoming)) return prev;
          return incoming;
        });

        markMessagesRead(activeId, token).catch(() => { });
      })
      .catch(console.error);
  }, [activeId, token, user?.github_id]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // ── auto-refresh polling ────────────────────────────────────────────────
  useEffect(() => {
    if (!activeId || !token) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000); // polls every 3 seconds

    return () => clearInterval(interval); // cleanup on convo switch or unmount
  }, [activeId, token, fetchMessages]);

  // ── auto-refresh conversation list ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      getConversationsSummary(token)
        .then((res) => {
          const summaryMap = {};
          (res.data || []).forEach((s) => { summaryMap[s.other_id] = s; });
          setConversations((prev) =>
            prev.map((c) => ({
              ...c,
              last: summaryMap[c.id]?.last_text || c.last,
              time: summaryMap[c.id]?.last_time
                ? new Date(summaryMap[c.id].last_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : c.time,
              unread: activeId === c.id ? 0 : (summaryMap[c.id]?.unread_count ?? c.unread),
            }))
          );
        })
        .catch(() => { });
    }, 5000); // slightly slower than message poll — 5s is fine for sidebar

    return () => clearInterval(interval);
  }, [token, activeId]);

  // auto-scroll
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, otherTyping]);

  // ── close emoji on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── auto-resize textarea ────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [draft]);

  // ── file select ─────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    setPendingFile({ file, previewUrl, type: file.type, name: file.name });
    e.target.value = "";
  };

  const clearPending = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
  };

  // ── send ────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!draft.trim() && !pendingFile) || sending) return;
    if (!activeId) return;

    setSending(true);
    const text = draft.trim();
    setDraft("");
    setReplyTo(null);

    let attachment = null;

    if (pendingFile) {
      try {
        const form = new FormData();
        form.append("file", pendingFile.file);
        const res = await uploadAttachment(form, token);
        attachment = res.data;
      } catch (err) {
        console.error("Upload failed:", err);
      }
      clearPending();
    }

    try {
      await sendMessage(activeId, text, token, { attachment, replyTo: replyTo?.id });
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── draft change (typing indicator hook-point) ──────────────────────────
  const handleDraftChange = (e) => {
    setDraft(e.target.value);
    // TODO: emit socket "typing" event here
  };

  // ── message actions ─────────────────────────────────────────────────────
  const handleCopy = (text) => navigator.clipboard.writeText(text).catch(() => { });

  const handleDelete = async (msgId) => {
    // Optimistically remove from UI
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await deleteMessage(msgId, token);
    } catch (err) {
      console.error("Delete failed:", err);
      // Re-fetch to restore if backend rejected it
      fetchMessages();
    }
  };

  // ── filtered conversations ──────────────────────────────────────────────
  const filteredConvos = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── last-seen string ────────────────────────────────────────────────────
  const lastSeenStr = (id) => {
    const d = lastSeen[id];
    if (!d) return null;
    const mins = Math.round((Date.now() - d) / 60000);
    if (mins < 1) return "Last seen just now";
    if (mins < 60) return `Last seen ${mins}m ago`;
    const hrs = Math.round(mins / 60);
    return `Last seen ${hrs}h ago`;
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh", backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <Sidebar activePage="messages" />

      <div className="messages-page">
        {/* ── conversations panel ── */}
        <div className="conversations-panel">
          <div className="conversations-header">
            <div className="conversations-title-row">
              <span className="conversations-icon">💬</span>
              <h1 className="conversations-title">Messages</h1>
            </div>
            <p className="conversations-subtitle">Connect and collaborate with developers</p>
            <div className="conversations-search-row">
              <div className="conversations-search">
                <FiSearch size={16} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="conversations-filter-btn"><FiSliders size={16} /></button>
            </div>
          </div>

          <div className="conversations-list">
            {loadingConvos ? (
              <p style={{ padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Loading conversations...</p>
            ) : filteredConvos.length === 0 ? (
              <p style={{ padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {search ? "No conversations match your search." : "No connections yet — connect with developers to start chatting."}
              </p>
            ) : (
              filteredConvos.map((c) => (
                <div
                  key={c.id}
                  className={`conversation-item ${activeId === c.id ? "conversation-item-active" : ""}`}
                  onClick={() => {
                    setActiveId(c.id);
                    // Clear unread badge locally on click
                    setConversations((prev) =>
                      prev.map((conv) => conv.id === c.id ? { ...conv, unread: 0 } : conv)
                    );
                  }}
                >
                  <div className="conversation-avatar-wrap">
                    <div className="conversation-avatar">
                      {c.avatar
                        ? <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        : firstLetter(c.name)}
                    </div>
                    {onlineIds.has(c.id) && <span className="online-dot" />}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-row-top">
                      <span className="conversation-name">{c.name}</span>
                      <span className="conversation-time">{c.time}</span>
                    </div>
                    <div className="conversation-row-bottom">
                      <span className="conversation-last">{c.last}</span>
                      {c.unread > 0 && (
                        <span className="unread-badge">{c.unread > 99 ? "99+" : c.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── chat panel ── */}
        <div className="chat-panel">
          {activeConvo ? (
            <>
              {/* header */}
              <div className="chat-header">
                <div className="chat-header-left">
                  <div className="chat-header-avatar-wrap" style={{ position: "relative" }}>
                    <div className="chat-header-avatar">
                      {activeConvo.avatar
                        ? <img src={activeConvo.avatar} alt={activeConvo.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        : firstLetter(activeConvo.name)}
                    </div>
                    {onlineIds.has(activeConvo.id) && <span className="online-dot online-dot-header" />}
                  </div>
                  <div className="chat-header-info">
                    <div className="chat-header-name-row">
                      <span className="chat-header-name">{activeConvo.name}</span>
                    </div>
                    <span className="chat-header-role">
                      {onlineIds.has(activeConvo.id)
                        ? <span style={{ color: "#22c55e", fontSize: "0.75rem" }}>● Online</span>
                        : lastSeenStr(activeConvo.id)
                          ? <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{lastSeenStr(activeConvo.id)}</span>
                          : `@${activeConvo.username}`}
                    </span>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button className="chat-action-btn"><FiInfo size={17} /></button>
                  <button className="chat-action-btn"><FiMoreVertical size={17} /></button>
                </div>
              </div>

              {/* messages body */}
              <div className="chat-body" ref={bodyRef}>
                {messages.length === 0 ? (
                  <div className="chat-empty-state" style={{ flex: 1 }}>
                    <div className="empty-illustration">👋</div>
                    <p className="empty-title">No messages yet</p>
                    <p className="empty-sub">Say hello to {activeConvo.name}!</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`chat-msg-row ${m.fromMe ? "chat-msg-row-right" : "chat-msg-row-left"}`}
                      onMouseEnter={() => setHoveredMsgId(m.id)}
                      onMouseLeave={() => setHoveredMsgId(null)}
                    >
                      {!m.fromMe && (
                        <div className="chat-msg-avatar">{firstLetter(activeConvo.name)}</div>
                      )}

                      <div className="chat-msg-col">
                        {/* reply-to preview */}
                        {m.replyTo && (
                          <div className={`reply-preview ${m.fromMe ? "reply-preview-right" : ""}`}>
                            <span className="reply-bar" />
                            <span className="reply-text">{m.replyTo.text || "Attachment"}</span>
                          </div>
                        )}

                        <div className={`chat-bubble ${m.fromMe ? "chat-bubble-right" : "chat-bubble-left"}`}>
                          {/* attachment */}
                          {m.attachment && (() => {
                            const { url, mime, name } = m.attachment;
                            if (mime?.startsWith("image/")) {
                              return (
                                <img
                                  src={url}
                                  alt={name}
                                  className="msg-image"
                                  onClick={() => window.open(url, "_blank")}
                                />
                              );
                            }
                            return (
                              <a href={url} target="_blank" rel="noreferrer" className="attachment-card">
                                <span className="attachment-icon"><AttachmentIcon mime={mime} /></span>
                                <span className="attachment-name">{name}</span>
                              </a>
                            );
                          })()}

                          {/* text */}
                          {m.text && <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span className={`chat-msg-time ${m.fromMe ? "chat-msg-time-right" : ""}`}>{m.time}</span>
                          {m.fromMe && <TickIcon status={m.status} />}
                        </div>
                      </div>

                      {m.fromMe && (
                        <div className="chat-msg-avatar chat-msg-avatar-me">
                          {user?.avatar
                            ? <img src={user.avatar} alt="me" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                            : firstLetter(user?.username || "Me")}
                        </div>
                      )}

                      {/* hover actions */}
                      {hoveredMsgId === m.id && (
                        <div className={`msg-actions ${m.fromMe ? "msg-actions-left" : "msg-actions-right"}`}>
                          <button className="msg-action-btn" title="Reply" onClick={() => setReplyTo(m)}>
                            <FiCornerUpLeft size={13} />
                          </button>
                          <button className="msg-action-btn" title="Copy" onClick={() => handleCopy(m.text)}>
                            <FiCopy size={13} />
                          </button>
                          <button className="msg-action-btn" title="Forward" onClick={() => { setForwardMsg(m); setShowForwardModal(true); }}>
                            <FiShare2 size={13} />
                          </button>
                          {m.fromMe && (
                            <button className="msg-action-btn msg-action-delete" title="Delete" onClick={() => handleDelete(m.id)}>
                              <FiTrash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* typing indicator */}
                {otherTyping && (
                  <div className="chat-msg-row chat-msg-row-left">
                    <div className="chat-msg-avatar">{firstLetter(activeConvo?.name)}</div>
                    <div className="typing-indicator">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
              </div>

              {/* composer */}
              <div className="chat-composer-wrap">
                {/* reply banner */}
                {replyTo && (
                  <div className="reply-banner">
                    <span className="reply-banner-bar" />
                    <div className="reply-banner-content">
                      <span className="reply-banner-label">Replying to</span>
                      <span className="reply-banner-text">{replyTo.text || "Attachment"}</span>
                    </div>
                    <button className="reply-banner-close" onClick={() => setReplyTo(null)}><FiX size={14} /></button>
                  </div>
                )}

                {/* pending file preview */}
                {pendingFile && (
                  <div className="pending-file-preview">
                    {pendingFile.previewUrl
                      ? <img src={pendingFile.previewUrl} alt="preview" className="pending-img-preview" />
                      : (
                        <div className="pending-file-card">
                          <AttachmentIcon mime={pendingFile.type} />
                          <span>{pendingFile.name}</span>
                        </div>
                      )}
                    <button className="pending-clear-btn" onClick={clearPending}><FiX size={14} /></button>
                  </div>
                )}

                <div className="chat-composer">
                  {/* hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpg,image/jpeg,image/png,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <button className="composer-icon-btn" onClick={() => fileInputRef.current?.click()}>
                    <FiPaperclip size={18} />
                  </button>

                  <textarea
                    ref={textareaRef}
                    className="composer-input composer-textarea"
                    placeholder="Type a message..."
                    value={draft}
                    onChange={handleDraftChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />

                  {/* emoji picker */}
                  <div style={{ position: "relative" }} ref={emojiRef}>
                    <button className="composer-icon-btn" onClick={() => setShowEmoji((v) => !v)}>
                      <FiSmile size={18} />
                    </button>
                    {showEmoji && (
                      <div className="emoji-picker-wrap">
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            setDraft((prev) => prev + emojiData.emoji);
                            setShowEmoji(false);
                            textareaRef.current?.focus();
                          }}
                          height={380}
                          width={320}
                          searchDisabled={false}
                          skinTonesDisabled
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    className="composer-send-btn"
                    onClick={handleSend}
                    disabled={sending}
                    style={{ opacity: sending ? 0.7 : 1 }}
                  >
                    <FiSend size={17} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* empty state */
            <div className="chat-empty-state">
              {loadingConvos ? "Loading..." : (
                <>
                  <div className="empty-illustration">💬</div>
                  <p className="empty-title">Your messages</p>
                  <p className="empty-sub">Select a conversation to start chatting</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showForwardModal && forwardMsg && (
        <div className="forward-modal-overlay" onClick={() => setShowForwardModal(false)}>
          <div className="forward-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forward-modal-header">
              <span className="forward-modal-title">Forward to...</span>
              <button className="forward-modal-close" onClick={() => setShowForwardModal(false)}>
                <FiX size={16} />
              </button>
            </div>
            <div className="forward-modal-list">
              {conversations
                .filter((c) => c.id !== activeId) // exclude current chat
                .map((c) => (
                  <div
                    key={c.id}
                    className="forward-modal-item"
                    onClick={async () => {
                      setShowForwardModal(false);
                      try {
                        await sendMessage(c.id, forwardMsg.text, token, {
                          attachment: forwardMsg.attachment,
                        });
                        // if forwarding to current chat, refresh
                        if (c.id === activeId) fetchMessages();
                      } catch (err) {
                        console.error("Forward failed:", err);
                      }
                      setForwardMsg(null);
                    }}
                  >
                    <div className="conversation-avatar" style={{ width: 36, height: 36, fontSize: "0.9rem", flexShrink: 0 }}>
                      {c.avatar
                        ? <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        : firstLetter(c.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text)" }}>{c.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>@{c.username}</div>
                    </div>
                  </div>
                ))}
              {conversations.filter((c) => c.id !== activeId).length === 0 && (
                <p style={{ padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  No other conversations to forward to.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default Messages;