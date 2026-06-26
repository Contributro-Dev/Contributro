import { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { getProjectTasks, createTask, updateTask } from "../services/taskServices.js";
import { getProject } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import "./ProjectTasks.css";

const STATUS_LABEL = {
  to_do: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  review: "Review",
  done: "Done",
};

const STATUS_DOT = {
  to_do: "#f59e0b",
  in_progress: "#8b5cf6",
  in_review: "#3b82f6",
  review: "#6b7280",
  done: "#10b981",
};

const PRIORITY_COLOR = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#059669",
};

const AVATAR_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

function avatarColor(name) {
  if (!name) return "#9ca3af";
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function toDateKey(d) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dueLabel(task) {
  if (!task.due_date) return null;

  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((due - today) / 86400000);

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";

  return `Due in ${diffDays} days`;
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = startDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, nextDay), inMonth: false });
    nextDay++;
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const FILTERS = [
  { value: "all", label: "All Tasks" },
  { value: "to_do", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

function ProjectTasks() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("timeline"); // timeline | calendar
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Panel-local pending edits (owner only)
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingPriority, setPendingPriority] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    Promise.all([getProject(id, token), getProjectTasks(id, token)])
      .then(([projectRes, tasksRes]) => {
        setProject(projectRes.data);
        setTasks(tasksRes.data);
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to load tasks");
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  const isOwner = project && String(project.owner_github_id) === String(user.github_id);

  // Default view differs by role to match the mock: owner -> Timeline, member -> Calendar
  useEffect(() => {
    if (project) setView(isOwner ? "timeline" : "calendar");
  }, [project, isOwner]);

  const refreshTasks = (afterSelectId) => {
    getProjectTasks(id, token)
      .then((res) => {
        setTasks(res.data);
        if (afterSelectId) {
          const updated = res.data.find((t) => t._id === afterSelectId);
          if (updated) setSelectedTask(updated);
        }
      })
      .catch((err) => console.error(err));
  };

  // Visible tasks for the current viewer (owner sees all, member sees only their own)
  const visibleTasks = useMemo(() => {
    if (isOwner) return tasks;
    return tasks.filter((t) => String(t.assignee_github_id) === String(user.github_id));
  }, [tasks, isOwner, user.github_id]);

  const filteredTasks = useMemo(() => {
    if (filter === "all") return visibleTasks;
    return visibleTasks.filter((t) => t.status === filter);
  }, [visibleTasks, filter]);

  // Default-select the most urgent open task once tasks load
  useEffect(() => {
    if (!selectedTask && visibleTasks.length > 0) {
      const firstOpen = visibleTasks.find((t) => t.status !== "done") || visibleTasks[0];
      setSelectedTask(firstOpen);
    }
  }, [visibleTasks, selectedTask]);

  useEffect(() => {
    if (selectedTask) {
      setPendingStatus(selectedTask.status);
      setPendingPriority(selectedTask.priority);
      setEditingAssignee(false);
    }
  }, [selectedTask]);

  const handleAssigneeChange = (taskId, githubId) => {
    updateTask(taskId, { assignee_github_id: githubId || null }, token)
      .then(() => {
        refreshTasks(taskId);
        setEditingAssignee(false);
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to assign");
      });
  };

  const handleUpdatePanel = () => {
    if (!selectedTask) return;
    const payload = {};
    if (pendingStatus !== selectedTask.status) payload.status = pendingStatus;
    if (isOwner && pendingPriority !== selectedTask.priority) payload.priority = pendingPriority;
    if (Object.keys(payload).length === 0) return;
    setUpdating(true);
    updateTask(selectedTask._id, payload, token)
      .then(() => refreshTasks(selectedTask._id))
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to update task");
      })
      .finally(() => setUpdating(false));
  };

  const handleSubtaskToggle = (task, subtaskId) => {
    const newSubtasks = task.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s));
    updateTask(task._id, { subtasks: newSubtasks }, token)
      .then(() => refreshTasks(task._id))
      .catch((err) => console.error(err));
  };

  const tasksByDate = useMemo(() => {
    const map = {};
    visibleTasks.forEach((t) => {
      if (!t.due_date) return;
      const key = toDateKey(t.due_date);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [visibleTasks]);

  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredTasks.forEach((t) => {
      const key = t.due_date
        ? new Date(t.due_date).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        : "No due date";
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [filteredTasks]);

  const upcoming = useMemo(
    () => visibleTasks.filter((t) => t.status !== "done" && t.due_date).slice(0, 8),
    [visibleTasks]
  );

  // Member sidebar widgets
  const dueToday = useMemo(() => {
    const todayKey = toDateKey(new Date());
    return visibleTasks.filter((t) => t.status !== "done" && t.due_date && toDateKey(t.due_date) === todayKey);
  }, [visibleTasks]);

  const thisWeek = useMemo(() => {
    const today = startOfToday();
    const weekOut = new Date(today);
    weekOut.setDate(weekOut.getDate() + 7);
    return visibleTasks.filter((t) => {
      if (t.status === "done" || !t.due_date) return false;
      const due = new Date(t.due_date);
      due.setHours(0, 0, 0, 0);
      return due > today && due <= weekOut;
    });
  }, [visibleTasks]);

  const recentlyCompleted = useMemo(
    () => visibleTasks.filter((t) => t.status === "done").slice(-2).reverse(),
    [visibleTasks]
  );

  if (loading) return <div className="tasks-loading-screen">Loading...</div>;
  if (!project) return <div className="tasks-loading-screen">Project not found.</div>;

  const monthLabel = calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weeks = getMonthGrid(calendarDate.getFullYear(), calendarDate.getMonth());

  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";


  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar activePage="" />
      <div className="tasks-page">
        {/* Top navbar (search/profile), consistent with rest of app */}
        <div className="tasks-topnav">
          <div className="search-bar">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search projects, skills, technologies..." />
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

        <div className="tasks-body-wrap">
          <button className="back" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span className="ml-2">Back</span>
          </button>

          <div className="tasks-header-row">
            <div>
              <h1>{isOwner ? "Upcoming Tasks" : "My Tasks"}</h1>
              <p>
                {isOwner
                  ? "Plan and track tasks assigned to your team"
                  : "Track and manage your assigned tasks"}
              </p>
            </div>
            {isOwner && (
              <div className="tasks-header-actions">
                <button className="create-task-btn" onClick={() => setShowCreateModal(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Task
                </button>
                <div className="filter-dropdown">
                  <button className="filter-btn" onClick={() => setFilterOpen((o) => !o)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    {FILTERS.find((f) => f.value === filter)?.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {filterOpen && (
                    <div className="filter-menu">
                      {FILTERS.map((f) => (
                        <div
                          key={f.value}
                          className={`filter-option ${filter === f.value ? "active" : ""}`}
                          onClick={() => {
                            setFilter(f.value);
                            setFilterOpen(false);
                          }}
                        >
                          {f.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="tasks-content-grid">
            <div className="tasks-main-col">
              <div className="tasks-view-tabs">
                <span className={view === "timeline" ? "tab-active" : ""} onClick={() => setView("timeline")}>
                  Timeline
                </span>
                <span className={view === "calendar" ? "tab-active" : ""} onClick={() => setView("calendar")}>
                  Calendar
                </span>
              </div>

              {view === "timeline" && (
                <div className="timeline-list">
                  {Object.entries(groupedByDate).map(([date, dateTasks]) => (
                    <div key={date} className="timeline-group">
                      <div className="timeline-date-row">
                        <div className="timeline-date-badge">
                          <span className="badge-day">{new Date(dateTasks[0].due_date || Date.now()).getDate()}</span>
                          <span className="badge-month">
                            {new Date(dateTasks[0].due_date || Date.now()).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                          </span>
                        </div>
                        <div className="timeline-date-label">
                           {date !== "No due date" ? new Date(date).toLocaleDateString("en-US", { weekday: "long" }) : date}
                        </div>
                      </div>
                      <div className="timeline-date-tasks">
                        {dateTasks.map((task) => (
                          <div
                            key={task._id}
                            className={`task-row-card ${selectedTask?._id === task._id ? "task-row-active" : ""} ${task.is_overdue ? "task-row-overdue" : ""}`}
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="task-row-top">
                              <span className="task-row-id">#{task._id.slice(-4)}</span>
                              <span className="task-row-title">{task.title}</span>
                              <span className={`status-pill status-${task.status}`}>
                                {STATUS_LABEL[task.status] || task.status}
                              </span>
                              <button className="task-row-dots" onClick={(e) => e.stopPropagation()}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
                                </svg>
                              </button>
                            </div>
                            {task.description && <div className="task-row-desc">{task.description}</div>}
                            <div className="task-row-meta">
                              {task.assignee_username ? (
                                <span className="meta-chip">
                                  <span className="avatar-dot" style={{ background: avatarColor(task.assignee_username) }}>
                                    {task.assignee_username.charAt(0).toUpperCase()}
                                  </span>
                                  {task.assignee_username}
                                </span>
                              ) : (
                                <span className="meta-chip muted">Unassigned</span>
                              )}
                              {task.due_date && (
                                <span className="meta-chip">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                  </svg>
                                  {dueLabel(task)}
                                </span>
                              )}
                              <span className="meta-chip" style={{ color: PRIORITY_COLOR[task.priority] }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 22V4" /><path d="M4 4h13l-3 5 3 5H4" />
                                </svg>
                                {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredTasks.length === 0 && <div className="tasks-empty">No tasks yet.</div>}
                  {filteredTasks.length > 0 && (
                    <button className="view-more-btn">
                      View more tasks
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {view === "calendar" && (
                <div className="calendar-view">
                  <div className="calendar-controls">
                    <button
                      className="cal-nav-btn"
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <span className="cal-month-label">{monthLabel}</span>
                    <button
                      className="cal-nav-btn"
                      onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                    <div className="cal-controls-right">
                      <button className="cal-today-btn" onClick={() => setCalendarDate(new Date())}>Today</button>
                    </div>
                  </div>

                  <div className="calendar-grid">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <div key={d} className="calendar-dow">{d}</div>
                    ))}
                    {weeks.flat().map((cell, i) => {
                      const key = toDateKey(cell.date);
                      const dayTasks = tasksByDate[key] || [];
                      const isToday = key === toDateKey(new Date());
                      return (
                        <div key={i} className={`calendar-cell ${cell.inMonth ? "" : "calendar-cell-out"}`}>
                          <span className={`calendar-daynum ${isToday ? "calendar-today" : ""}`}>{cell.date.getDate()}</span>
                          <div className="calendar-cell-tasks">
                            {dayTasks.slice(0, 2).map((t) => (
                              <div
                                key={t._id}
                                className="calendar-task-chip"
                                onClick={() => setSelectedTask(t)}
                              >
                                <span className="chip-dot" style={{ background: t.is_overdue ? "#ef4444" : STATUS_DOT[t.status] }} />
                                {t.title}
                              </div>
                            ))}
                            {dayTasks.length > 2 && <div className="calendar-task-more">+{dayTasks.length - 2} more</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="calendar-legend">
                    {Object.entries(STATUS_LABEL).filter(([k]) => k !== "review").map(([k, label]) => (
                      <span key={k} className="legend-item">
                        <span className="legend-dot" style={{ background: STATUS_DOT[k] }} />
                        {label}
                      </span>
                    ))}
                    <span className="legend-item">
                      <span className="legend-dot" style={{ background: "#ef4444" }} />
                      Overdue
                    </span>
                  </div>

                  <div className="calendar-upcoming">
                    <div className="calendar-upcoming-header">
                      <span>{isOwner ? "Upcoming Tasks" : "My Upcoming Tasks"}</span>
                      <span className="upcoming-count">{upcoming.length}</span>
                    </div>
                    <table className="upcoming-table">
                      <thead>
                        <tr>
                          <th>Task</th>
                          {isOwner ? <th>Assignee</th> : <th>Project</th>}
                          <th>Due Date</th>
                          <th>Priority</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcoming.map((t) => (
                          <tr key={t._id} onClick={() => setSelectedTask(t)} className="upcoming-row">
                            <td>
                              <span className="upcoming-id">#{t._id.slice(-4)}</span> {t.title}
                            </td>
                            {isOwner ? (
                              <td>
                                {t.assignee_username ? (
                                  <span className="meta-chip">
                                    <span className="avatar-dot" style={{ background: avatarColor(t.assignee_username) }}>
                                      {t.assignee_username.charAt(0).toUpperCase()}
                                    </span>
                                    {t.assignee_username}
                                  </span>
                                ) : (
                                  <span className="meta-chip muted">Unassigned</span>
                                )}
                              </td>
                            ) : (
                              <td>{project.title}</td>
                            )}
                            <td>{t.due_date ? new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                            <td style={{ color: PRIORITY_COLOR[t.priority] }}>
                              {t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1)}
                            </td>
                            <td>
                              <span className={`status-pill status-${t.status}`}>{STATUS_LABEL[t.status] || t.status}</span>
                            </td>
                          </tr>
                        ))}
                        {upcoming.length === 0 && (
                          <tr><td colSpan={5} className="tasks-empty">No upcoming tasks.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: owner gets Task Details, member gets summary widgets */}
            <div className="tasks-side-col">
              <div className="task-details-panel">
                {selectedTask ? (
                  <>
                    <div className="task-details-header">
                      <span className="task-id-badge">#{selectedTask._id.slice(-4)}</span>
                      <span>Task Details</span>
                    </div>
                    <h2>{selectedTask.title}</h2>
                    {selectedTask.description && <p className="task-details-desc">{selectedTask.description}</p>}

                    <div className="panel-section">
                      <label>Assigned To</label>
                      {editingAssignee ? (
                        <select
                          className="settings-input"
                          value={selectedTask.assignee_github_id || ""}
                          onChange={(e) => handleAssigneeChange(selectedTask._id, e.target.value)}
                          autoFocus
                        >
                          <option value="">Unassigned</option>
                          {project.members_info?.map((m) => (
                            <option key={m.github_id} value={m.github_id}>{m.username}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="panel-assignee-row">
                          {selectedTask.assignee_username ? (
                            <span className="meta-chip">
                              <span className="avatar-dot" style={{ background: avatarColor(selectedTask.assignee_username) }}>
                                {selectedTask.assignee_username.charAt(0).toUpperCase()}
                              </span>
                              {selectedTask.assignee_username}
                            </span>
                          ) : (
                            <span className="meta-chip muted">Unassigned</span>
                          )}
                          {/* Only the owner can reassign - backend restricts assignee_github_id to owner_fields */}
                          {isOwner && (
                            <button className="change-btn" onClick={() => setEditingAssignee(true)}>Change</button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="panel-row-split">
                      <div className="panel-section">
                        <label>Status</label>
                        <select className="settings-input" value={pendingStatus} onChange={(e) => setPendingStatus(e.target.value)}>
                          <option value="to_do">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                      <div className="panel-section">
                        <label>Priority</label>
                        {isOwner ? (
                          <select className="settings-input" value={pendingPriority} onChange={(e) => setPendingPriority(e.target.value)}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        ) : (
                          <div className="panel-static-value" style={{ color: PRIORITY_COLOR[selectedTask.priority] }}>
                            {selectedTask.priority ? selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1) : "—"}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedTask.due_date && (
                      <div className="panel-section">
                        <label>Due Date</label>
                        <div className="panel-static-value">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {new Date(selectedTask.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    )}

                    <div className="panel-section">
                      <label>Project</label>
                      <div className="panel-project-row">
                        <span className="project-mini-icon">{"</>"}</span>
                        <span>{project.title}</span>
                        <a className="view-project-link" onClick={() => navigate(`/projects/${id}`)}>
                          View Project &rarr;
                        </a>
                      </div>
                    </div>

                    {selectedTask.subtasks?.length > 0 && (
                      <div className="panel-section">
                        <label>
                          Subtasks ({selectedTask.subtasks.filter((s) => s.done).length}/{selectedTask.subtasks.length})
                        </label>
                        {selectedTask.subtasks.map((s) => (
                          <div key={s.id} className="subtask-row" onClick={() => handleSubtaskToggle(selectedTask, s.id)}>
                            <span className={`subtask-check ${s.done ? "checked" : ""}`}>{s.done ? "\u2713" : ""}</span>
                            <span className={s.done ? "subtask-done" : ""}>{s.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button className="update-status-btn" onClick={handleUpdatePanel} disabled={updating}>
                      {updating ? "Updating..." : "Update Status"}
                    </button>
                  </>
                ) : (
                  <div className="tasks-empty">Select a task to view details.</div>
                )}
              </div>

              {!isOwner && (
                <div className="member-widgets">
                  <div className="widget-card">
                    <div className="widget-header">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Due Today</span>
                      <span className="widget-count">{dueToday.length}</span>
                    </div>
                    {dueToday.length === 0 && <div className="widget-empty">Nothing due today.</div>}
                    {dueToday.map((t) => (
                      <div key={t._id} className="widget-task-row" onClick={() => setSelectedTask(t)}>
                        <span className="widget-dot" style={{ background: STATUS_DOT[t.status] }} />
                        <div className="widget-task-info">
                          <span className="widget-task-title">#{t._id.slice(-4)} {t.title}</span>
                          <span className="widget-task-sub">{project.title}</span>
                        </div>
                        <span className={`status-pill status-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="widget-card">
                    <div className="widget-header">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>This Week</span>
                      <span className="widget-count">{thisWeek.length}</span>
                    </div>
                    {thisWeek.length === 0 && <div className="widget-empty">Nothing else due this week.</div>}
                    {thisWeek.map((t) => (
                      <div key={t._id} className="widget-task-row" onClick={() => setSelectedTask(t)}>
                        <span className="widget-dot" style={{ background: STATUS_DOT[t.status] }} />
                        <div className="widget-task-info">
                          <span className="widget-task-title">{t.title}</span>
                          <span className="widget-task-sub">Due on {new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                        <span className={`status-pill status-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="widget-card">
                    <div className="widget-header">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>Recently Completed</span>
                      <span className="widget-count">{recentlyCompleted.length}</span>
                    </div>
                    {recentlyCompleted.length === 0 && <div className="widget-empty">No completed tasks yet.</div>}
                    {recentlyCompleted.map((t) => (
                      <div key={t._id} className="widget-task-row" onClick={() => setSelectedTask(t)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                        <div className="widget-task-info">
                          <span className="widget-task-title">#{t._id.slice(-4)} {t.title}</span>
                          <span className="widget-task-sub">
                            {/* No completed_at field on the backend yet - falls back to due date */}
                            {t.due_date ? `Completed around ${new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "Completed"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateTaskModal
          project={project}
          token={token}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refreshTasks();
          }}
        />
      )}
    </div>
  );
}

function CreateTaskModal({ project, token, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [saving, setSaving] = useState(false);

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks((prev) => [...prev, subtaskInput.trim()]);
    setSubtaskInput("");
  };

  const removeSubtask = (index) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    setSaving(true);
    createTask(
      project._id,
      {
        title,
        description,
        assignee_github_id: assignee || null,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        subtasks,
      },
      token
    )
      .then(() => onCreated())
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to create task");
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create Task</h2>

        <label className="settings-label">
          Title
          <input className="settings-input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>

        <label className="settings-label">
          Description
          <textarea className="settings-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label className="settings-label">
          Assign To
          <select className="settings-input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {project.members_info?.map((m) => (
              <option key={m.github_id} value={m.github_id}>{m.username}</option>
            ))}
          </select>
        </label>

        <div className="settings-row">
          <label className="settings-label">
            Priority
            <select className="settings-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="settings-label">
            Due Date
            <input type="date" className="settings-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>

        <label className="settings-label">Subtasks</label>
        {subtasks.map((s, i) => (
          <div key={i} className="subtask-row">
            <span>{s}</span>
            <button className="settings-remove-btn" onClick={() => removeSubtask(i)}>Remove</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            className="settings-input"
            value={subtaskInput}
            onChange={(e) => setSubtaskInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtask())}
            placeholder="Add a subtask..."
          />
          <button className="settings-save-btn" onClick={addSubtask}>Add</button>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button className="settings-save-btn" onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Create Task"}
          </button>
          <button className="settings-remove-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default ProjectTasks;