import { useParams } from 'react-router-dom'
import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getProject, joinProject, getReadme, getCommits, getIssues, getPulls } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import { useNavigate } from 'react-router-dom'
import "./ProjectDetail.css";
import codeIcon from "../assets/project-icon.png"
import ReactMarkdown from "react-markdown";


function ProjectDetail() {

  const { login, user, token, logout } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [showFullDesc, setShowFullDesc] = useState(false)

  const navigate = useNavigate()

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true)
  const [isPending, setIsPending] = useState(false)

  const [activeTab, setActiveTab] = useState("overview")

  const [readme, setReadme] = useState(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState(null);

  const [commits, setCommits] = useState([]);
  const [commitsLoading, setCommitsLoading] = useState(false);

  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  const [pulls, setPulls] = useState([]);
  const [pullsLoading, setPullsLoading] = useState(false);

  const { id } = useParams()

  // Load project
  useEffect(() => {
    getProject(id, token).then((response) => {
      setProject(response.data)
      setLoading(false);

    }).catch(error => {
      setLoading(false);
      console.error(error);
      alert(error.response.data.message);
    })
  }, [id, token])

  // Load commits once project is available (used in overview "Last Commit" + commits section)
  useEffect(() => {
    if (!project) return
    setCommitsLoading(true)
    getCommits(id, token)
      .then(res => setCommits(res.data.commits || []))
      .catch(err => console.error(err))
      .finally(() => setCommitsLoading(false))
  }, [project, id, token])

  // Load README when README tab is opened
  useEffect(() => {
    if (activeTab !== "readme" || readme !== null) return
    setReadmeLoading(true)
    setReadmeError(null)
    getReadme(id, token)
      .then(res => setReadme(res.data.markdown))
      .catch(err => {
        console.error(err)
        setReadmeError(err.response?.data?.error || "Could not load README")
      })
      .finally(() => setReadmeLoading(false))
  }, [activeTab, readme, id, token])

  // Load issues when Issues tab is opened
  useEffect(() => {
    if (activeTab !== "issues") return
    setIssuesLoading(true)
    getIssues(id, token)
      .then(res => setIssues(res.data.issues || []))
      .catch(err => console.error(err))
      .finally(() => setIssuesLoading(false))
  }, [activeTab, id, token])

  // Load pull requests when Pull Request tab is opened
  useEffect(() => {
    if (activeTab !== "pull-request") return
    setPullsLoading(true)
    getPulls(id, token)
      .then(res => setPulls(res.data.pulls || []))
      .catch(err => console.error(err))
      .finally(() => setPullsLoading(false))
  }, [activeTab, id, token])

  const handelJoin = (() => {
    joinProject(id, token).then(() => {
      setIsPending(true)
    }).catch(error => {
      console.error(error);
    })
  })

  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";


  if (loading) return <div>Loading.....</div>

  const isOwner = String(project.owner_github_id) === String(user.github_id)
  const isMember = project.members?.map(String).includes(String(user.github_id))
  const createdDate = new Date(project.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

  const lastCommitLabel = commits.length > 0
    ? new Date(commits[0].date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : (commitsLoading ? "Loading..." : "No commits")


  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const segments1 = [
    { value: 50, color: "#10B981" }, // Skills
    { value: 30, color: "#f6d25c" }, // Activity
    { value: 18, color: "#3B82F6" }, // Compatibility
  ];

  const percentage1 = segments1.reduce(
    (sum, segment) => sum + segment.value,
    0
  );

  const segments2 = [
    { value: 60, color: "#10B981" }, // Skills
    { value: 20, color: "#f6d25c" }, // Activity
    { value: 10, color: "#3B82F6" }, // Compatibility
    { value: 10, color: "#df6a21" },
  ];

  const percentage2 = segments2.reduce(
    (sum, segment) => sum + segment.value,
    0
  );




  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
      <Sidebar activePage="" />
      <div className="project-detail-container">

        {/* navbar */}
        <div className="project-detail-nav">
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

        <div className="project-detail-content">
          {/* Main content */}
          <div className="center-content">

            {/* back to projects */}
            <button className="back" onClick={() => navigate(-1)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span className='ml-2 '>Back</span>
            </button>

            {/* hero section */}
            <div className="hero-section">
              <div className="left-hero">
                <div className="logo-section">
                  <img
                    src={codeIcon}
                    alt="Code Icon"
                    width={170}
                    height={170}
                    className='logo'
                  />
                </div>
                <div className="details-section">
                  <div className="project-title">
                    <span className='title'>{project.title}</span>

                    {isOwner && <span className="header-owner-badge">Owner</span>}
                  </div>
                  <div className="hearder-status">
                    {isMember && !isOwner &&
                      <div className="contributor-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="#42fe31"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>You are a contributor</span>
                      </div>}
                    <div className="status">{project.status}</div>

                    <div className="star-container">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F59E0B" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="card-star-count">0</span>
                    </div>

                    <span className="match-badge">98% match</span>

                    <div className="member-container">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span className="member-number">
                        {project.members?.length || 0}/{project.team_size || '?'}
                        <span className='ml-1 text-gray-400'>Contributors</span>
                      </span>
                    </div>
                  </div>
                  <div className='project-desc-div'>
                    <div className={`project-desc-header ${showFullDesc ? '' : 'truncated'}`}>
                      {project.description}
                    </div>
                    <button className='read-more-btn' onClick={() => setShowFullDesc(!showFullDesc)}>
                      {showFullDesc ? 'Read less' : 'Read more...'}
                    </button>
                  </div>

                  <div className="skills-header">
                    {project.required_skills?.map(skill => (
                      <div key={skill} className="skill-tag">{skill}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right hero btns */}
              <div className="right-hero">

                {!isMember && !isOwner && !isPending &&
                  (<div className='join-btn-div'>
                    <button className='join-project' onClick={handelJoin}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Join Project</span>
                    </button>
                    <button className='bookmark-hero-btn'>
                      <svg width="16" height="16" fill="none" stroke="#000000" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                      </svg>
                      <span>Bookmark</span>
                    </button>
                  </div>)
                }
                {!isMember && !isOwner && isPending &&
                  (<div className='pending-div'>
                    <button className='request-pending-btn'>
                      Request Pending
                    </button>
                    <button className='bookmark-hero-btn'>
                      <svg width="16" height="16" fill="none" stroke="#000000" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                      </svg>
                      <span>Bookmark</span>
                    </button>
                  </div>)
                }
                {isMember && !isOwner && !isPending &&
                  (
                    <div className='joined-btn-div'>
                      <div className='joined-span'>
                        <div className="span">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>Joined</span>
                        </div>
                        <button className="leaveproject-btn">Leave Project</button>
                      </div>
                      <div className="view-issue-div">
                        <button className="view-issue-btn" onClick={() => setActiveTab("issues")}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>view issues</span>
                        </button>
                        <button className="view-issue-dots">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="10.5" width="3" height="3" rx="1.5" fill="currentColor" />
                            <rect x="10.5" y="10.5" width="3" height="3" rx="1.5" fill="currentColor" />
                            <rect x="17" y="10.5" width="3" height="3" rx="1.5" fill="currentColor" />
                          </svg>
                        </button>
                      </div>
                      <div className="create-pull-div">
                        <button className="create-pull-btn" onClick={() => setActiveTab("pull-request")}>
                          <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 640 640"><path d="M392 88C392 78.3 386.2 69.5 377.2 65.8C368.2 62.1 357.9 64.2 351 71L295 127C285.6 136.4 285.6 151.6 295 160.9L351 216.9C357.9 223.8 368.2 225.8 377.2 222.1C386.2 218.4 392 209.7 392 200L392 176L416 176C433.7 176 448 190.3 448 208L448 422.7C419.7 435 400 463.2 400 496C400 540.2 435.8 576 480 576C524.2 576 560 540.2 560 496C560 463.2 540.3 435 512 422.7L512 208C512 155 469 112 416 112L392 112L392 88zM136 144C136 130.7 146.7 120 160 120C173.3 120 184 130.7 184 144C184 157.3 173.3 168 160 168C146.7 168 136 157.3 136 144zM192 217.3C220.3 205 240 176.8 240 144C240 99.8 204.2 64 160 64C115.8 64 80 99.8 80 144C80 176.8 99.7 205 128 217.3L128 422.6C99.7 434.9 80 463.1 80 495.9C80 540.1 115.8 575.9 160 575.9C204.2 575.9 240 540.1 240 495.9C240 463.1 220.3 434.9 192 422.6L192 217.3zM136 496C136 482.7 146.7 472 160 472C173.3 472 184 482.7 184 496C184 509.3 173.3 520 160 520C146.7 520 136 509.3 136 496zM480 472C493.3 472 504 482.7 504 496C504 509.3 493.3 520 480 520C466.7 520 456 509.3 456 496C456 482.7 466.7 472 480 472z" /></svg>
                          <span>Create Pull Request </span>
                        </button>
                      </div>
                    </div>
                  )
                }
                {isOwner &&
                  (<div className='joined-btn-div'>
                    <button className='your-project-btn'>
                      <span>Your Project</span>
                    </button>
                    <div className="view-issue-div">
                      <button className="view-issue-btn" onClick={() => setActiveTab("issues")}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>view issues</span>
                      </button>
                      <button className="view-issue-dots">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="4" y="10.5" width="3" height="3" rx="1.5" fill="currentColor" />
                          <rect x="10.5" y="10.5" width="3" height="3" rx="1.5" fill="currentColor" />
                          <rect x="17" y="10.5" width="3" height="3" rx="1.5" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                    <div className="create-pull-div">
                      <button className="create-pull-btn" onClick={() => setActiveTab("pull-request")}>
                        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 640 640"><path d="M392 88C392 78.3 386.2 69.5 377.2 65.8C368.2 62.1 357.9 64.2 351 71L295 127C285.6 136.4 285.6 151.6 295 160.9L351 216.9C357.9 223.8 368.2 225.8 377.2 222.1C386.2 218.4 392 209.7 392 200L392 176L416 176C433.7 176 448 190.3 448 208L448 422.7C419.7 435 400 463.2 400 496C400 540.2 435.8 576 480 576C524.2 576 560 540.2 560 496C560 463.2 540.3 435 512 422.7L512 208C512 155 469 112 416 112L392 112L392 88zM136 144C136 130.7 146.7 120 160 120C173.3 120 184 130.7 184 144C184 157.3 173.3 168 160 168C146.7 168 136 157.3 136 144zM192 217.3C220.3 205 240 176.8 240 144C240 99.8 204.2 64 160 64C115.8 64 80 99.8 80 144C80 176.8 99.7 205 128 217.3L128 422.6C99.7 434.9 80 463.1 80 495.9C80 540.1 115.8 575.9 160 575.9C204.2 575.9 240 540.1 240 495.9C240 463.1 220.3 434.9 192 422.6L192 217.3zM136 496C136 482.7 146.7 472 160 472C173.3 472 184 482.7 184 496C184 509.3 173.3 520 160 520C146.7 520 136 509.3 136 496zM480 472C493.3 472 504 482.7 504 496C504 509.3 493.3 520 480 520C466.7 520 456 509.3 456 496C456 482.7 466.7 472 480 472z" /></svg>
                        <span>Create Pull Request </span>
                      </button>
                    </div>
                  </div>)
                }
              </div>
            </div>

            {/* tabs */}
            <div className="tabs" >
              {/* overview */}
              <div className={`overview-btn ${activeTab === "overview" ? "tab-active" : ""}`} onClick={() => setActiveTab("overview")}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                <span>Overview</span>
              </div>

              {/* README */}
              {isMember && isOwner &&
                <div className={`readme-btn ${activeTab === "readme" ? "tab-active" : ""}`} onClick={() => setActiveTab("readme")}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="14" height="16">
                    <path d="M20,10 L70,10 L90,30 L90,110 L20,110 Z" fill="#ffffff" stroke="#333333" strokeWidth="3" strokeLinejoin="round" />

                    <path d="M70,10 L70,30 L90,30" fill="#f0f0f0" stroke="#333333" strokeWidth="3" strokeLinejoin="round" />

                    <line x1="35" y1="45" x2="75" y2="45" stroke="#333333" strokeWidth="3" strokeLinecap="round" />
                    <line x1="35" y1="60" x2="75" y2="60" stroke="#888888" strokeWidth="3" strokeLinecap="round" />
                    <line x1="35" y1="75" x2="60" y2="75" stroke="#888888" strokeWidth="3" strokeLinecap="round" />

                    <text x="35" y="98" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#333333">MD</text>
                  </svg>

                  <span>README</span>
                </div>
              }

              {/* contributors */}
              <div className={`contributors-btn ${activeTab === "contributors" ? "tab-active" : ""}`} onClick={() => setActiveTab("contributors")}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Contributors</span>
                <span className='w-4 h-4 text-[9px] bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600'>{project.members?.length || 0}</span>
              </div>
              {/* issues-btn */}
              <div className={`issues-btn ${activeTab === "issues" ? "tab-active" : ""}`} onClick={() => setActiveTab("issues")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Issues</span>
                <span className='w-4 h-4 text-[9px] bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600'>{issues.length}</span>
              </div>

              {/* Discussions-btn */}
              <div className={`discussions-btn ${activeTab === "discussions" ? "tab-active" : ""}`} onClick={() => setActiveTab("discussions")}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span>Discussions</span>
                <span className='w-4 h-4 text-[9px] bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600'>4</span>
              </div>

              {/* pull-request */}
              {isMember && isOwner &&
                <div className={`pull-request-btn ${activeTab === "pull-request" ? "tab-active" : ""}`} onClick={() => setActiveTab("pull-request")}>
                  <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 640 640"><path d="M392 88C392 78.3 386.2 69.5 377.2 65.8C368.2 62.1 357.9 64.2 351 71L295 127C285.6 136.4 285.6 151.6 295 160.9L351 216.9C357.9 223.8 368.2 225.8 377.2 222.1C386.2 218.4 392 209.7 392 200L392 176L416 176C433.7 176 448 190.3 448 208L448 422.7C419.7 435 400 463.2 400 496C400 540.2 435.8 576 480 576C524.2 576 560 540.2 560 496C560 463.2 540.3 435 512 422.7L512 208C512 155 469 112 416 112L392 112L392 88zM136 144C136 130.7 146.7 120 160 120C173.3 120 184 130.7 184 144C184 157.3 173.3 168 160 168C146.7 168 136 157.3 136 144zM192 217.3C220.3 205 240 176.8 240 144C240 99.8 204.2 64 160 64C115.8 64 80 99.8 80 144C80 176.8 99.7 205 128 217.3L128 422.6C99.7 434.9 80 463.1 80 495.9C80 540.1 115.8 575.9 160 575.9C204.2 575.9 240 540.1 240 495.9C240 463.1 220.3 434.9 192 422.6L192 217.3zM136 496C136 482.7 146.7 472 160 472C173.3 472 184 482.7 184 496C184 509.3 173.3 520 160 520C146.7 520 136 509.3 136 496zM480 472C493.3 472 504 482.7 504 496C504 509.3 493.3 520 480 520C466.7 520 456 509.3 456 496C456 482.7 466.7 472 480 472z" /></svg>
                  <span>Pull Request</span>
                  <span className='w-4 h-4 text-[9px] bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600'>{pulls.length}</span>
                </div>
              }

              {/* settings */}
              {isMember && isOwner &&
                <div className={`settings-btn ${activeTab === "settings" ? "tab-active" : ""}`} onClick={() => setActiveTab("settings")}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                  <span>settings</span>
                </div>
              }
            </div>



            <div className="body">
              {activeTab === "overview" && (
                <div className="overview-div">
                  {/* Members Stats */}
                  {isMember && isOwner &&
                    (
                      <div className='stats-div'>
                        <div className="stat-card-1">
                          <div className="stat-icon-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#24aafd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>

                          </div>
                          <div className="stat-info">
                            <span className="stat-number">4</span>
                            <span className="stat-label">Assigned Issues</span>
                            <span className="stat-sublabel">3 active</span>
                          </div>
                        </div>
                        <div className="stat-card-2">
                          <div className="stat-icon-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
                              <rect width="64" height="64" rx="16" />

                              <circle cx="32" cy="32" r="16" stroke="#148c28" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                              <path d="M24 32L29.5 37.5L40 26.5" stroke="#1e8c14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>


                          </div>
                          <div className="stat-info">
                            <span className="stat-number">2</span>
                            <span className="stat-label">Task completed</span>
                            <span className="stat-sublabel">Great job!</span>
                          </div>
                        </div>
                        <div className="stat-card-3">
                          <div className="stat-icon-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ff8e42" strokeWidth="2" strokeLinecap="round" strokeLlinejoin="round">
                              <circle cx="18" cy="6" r="3" />
                              <circle cx="6" cy="6" r="3" />
                              <circle cx="6" cy="18" r="3" />
                              <line x1="6" y1="9" x2="6" y2="15" />
                              <path d="M9 18h3a4 4 0 0 0 4-4V9" />
                            </svg>


                          </div>
                          <div className="stat-info">
                            <span className="stat-number">1</span>
                            <span className="stat-label">Open PRs</span>
                            <span className="stat-sublabel">Awaiting review</span>
                          </div>
                        </div>
                        <div className="stat-card-4">
                          <div className="stat-icon-4">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#24aafd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </div>
                          <div className="stat-info">
                            <span className="stat-number">2</span>
                            <span className="stat-label">Mentions</span>
                            <span className="stat-sublabel">Unreaded Messages</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  <div className="bottom-overview">

                    <div className="about-div">

                      <div className="about-section">
                        <div className="about-header">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <line x1="10" y1="9" x2="8" y2="9" />
                          </svg>
                          <span className="about-title">About this project</span>
                        </div>
                        <div className="about-desc">
                          <span>An end-to-end Machine Learning project that predicts student academic outcomes based on various factors such as attendance, study hours, previous grades, and demographic information.</span>
                        </div>
                      </div>

                      <div className="goal-section">
                        <div className="goal-header">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9660e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                          </svg>

                          <span className="goal-title">Goal</span>
                        </div>
                        <div className="goal-desc">
                          <span>Help educational institutions identify students who may need additional support and improve academic outcomes through data-driven insights.</span>
                        </div>
                      </div>

                      <div className="current-section">
                        <div className="current-header">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                          </svg>
                          <span className="current-title">Current Status</span>
                          <div className="badge-current">MVP develpoment</div>
                        </div>
                        <div className="current-desc">
                          <span>We have completed the data collection and model training. Now working on the dashboard and deployment.</span>
                        </div>
                      </div>

                      <div className="key-section">
                        <div className="key-header">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3c0 4.5 4.5 9 9 9-4.5 0-9 4.5-9 9 0-4.5-4.5-9-9-9 4.5 0 9-4.5 9-9z" />
                          </svg>

                          <span className="key-title">Key Features</span>
                        </div>

                        <div className="bullets-div">
                          <div className="bullet">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span>Data Processing and analysis</span>
                          </div>
                          <div className="bullet">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span>Predivtive Model for student performance</span>
                          </div>
                          <div className="bullet">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span>Interactive dashboard for visualization</span>
                          </div>
                          <div className="bullet">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span>Insight generation and recommendations</span>
                          </div>
                        </div>



                      </div>

                      <div className="need-section">
                        <div className="need-header">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>

                          <span className="need-title">Contributors Needed</span>
                        </div>
                        <div className="need-tags">
                          <div className="badge-need">Frontend Developer</div>
                          <div className="badge-need">ML Engineer</div>
                          <div className="badge-need">UI/UX Designer</div>
                        </div>
                      </div>

                      {/* Recent Commits */}
                      <div className="commits-section">
                        <div className="commits-header">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <line x1="3" y1="12" x2="9" y2="12" />
                            <line x1="15" y1="12" x2="21" y2="12" />
                          </svg>
                          <span className="commits-title">Recent Commits</span>
                        </div>
                        {commitsLoading && <div className="commits-empty">Loading commits...</div>}
                        {!commitsLoading && commits.length === 0 && (
                          <div className="commits-empty">No commits found, or no repo linked.</div>
                        )}
                        {!commitsLoading && commits.map(c => (
                          <a key={c.sha} href={c.url} target="_blank" rel="noreferrer" className="commit-row">
                            <span className="commit-sha">{c.sha}</span>
                            <span className="commit-message">{c.message}</span>
                            <span className="commit-meta">{c.author} · {new Date(c.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                          </a>
                        ))}
                      </div>

                    </div>

                    <div className="project-detail-div">
                      <div className="header-project-detail-div">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" />
                          <line x1="12" y1="12" x2="12" y2="16" />
                        </svg>
                        <span className="project-detail-title">Project Details</span>
                      </div>
                      <div className="details-div">
                        <div className="line-1">
                          <div className="left-detail">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="7" r="4" />
                              <path d="M5 21a7 7 0 0 1 14 0" />
                            </svg>

                            <span>Project Owner</span>
                          </div>
                          <div className="right-detail">
                            <span>{project.owner_github_id}</span>
                          </div>
                        </div>
                        <div className="line-2">
                          <div className="left-detail">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />

                              <line x1="3" y1="10" x2="21" y2="10" />

                              <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                              <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                              <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                              <line x1="8" y1="18" x2="8.01" y2="18" strokeWidth="2.5" />
                              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
                              <line x1="16" y1="18" x2="16.01" y2="18" strokeWidth="2.5" />
                            </svg>

                            <span>Created </span>
                          </div>
                          <div className="right-detail">
                            <span>{createdDate}</span>
                          </div>
                        </div>
                        <div className="line-3">
                          <div className="left-detail">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />

                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Last updated</span>
                          </div>
                          <div className="right-detail">
                            <span>{lastCommitLabel}</span>
                          </div>
                        </div>
                        <div className="line-4">
                          <div className="left-detail">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0 -7.07-7.07l-.7.7" />

                              <path d="M14 11a5 5 0 0 0 -7.07 0l-2.12 2.12a5 5 0 0 0 7.07 7.07l.7-.7" />
                            </svg>

                            <span>GitHub Repository</span>
                          </div>
                          <div className="right-detail">
                            {project.github_repo_url
                              ? <a href={project.github_repo_url} target="_blank" rel="noreferrer">
                                  {project.github_repo_url.replace("https://github.com/", "")}
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                </a>
                              : <span className="text-gray-400">No repo linked</span>
                            }
                          </div>
                        </div>
                        <div className="line-5">
                          <div className="left-detail">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" />
                              <line x1="12" y1="12" x2="12" y2="16" />
                            </svg>
                            <span>Project Status</span>
                          </div>
                          <div className="right-detail">
                            <span>Active</span>
                          </div>
                        </div>
                        <div className="line-6">
                          <div className="left-detail">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />

                              <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2.5" />
                            </svg>

                            <span>Project Type</span>
                          </div>
                          <div className="right-detail">
                            <span>Open Source</span>
                          </div>
                        </div>
                        <div className="line-7">
                          <div className="left-detail">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />

                              <line x1="2" y1="12" x2="22" y2="12" />

                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>

                            <span>Domain</span>
                          </div>
                          <div className="right-detail">
                            <span>Education,ML</span>
                          </div>
                        </div>
                        <div className="line-8">
                          <div className="left-detail">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="16 18 22 12 16 6" />

                              <polyline points="8 6 2 12 8 18" />
                            </svg>

                            <span>Language</span>
                          </div>
                          <div className="right-detail">
                            <span>Python</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "readme" && (
                <div className="readme-div">
                  {readmeLoading && <div className="readme-loading">Loading README...</div>}
                  {readmeError && <div className="readme-error">{readmeError}</div>}
                  {!readmeLoading && !readmeError && readme && (
                    <div className="readme-markdown">
                      <ReactMarkdown>{readme}</ReactMarkdown>
                    </div>
                  )}
                  {!readmeLoading && !readmeError && !readme && (
                    <div className="readme-empty">No README found for this repository.</div>
                  )}
                </div>
              )}

              {activeTab === "issues" && (
                <div className="issues-div">
                  {issuesLoading && <div className="issues-loading">Loading issues...</div>}
                  {!issuesLoading && issues.length === 0 && (
                    <div className="issues-empty">No open issues, or no repo linked.</div>
                  )}
{!issuesLoading && issues.map(issue => (
                    <a key={issue.number} href={issue.url} target="_blank" rel="noreferrer" className="issue-row">
                      <div className="issue-row-left">
                        <span className="issue-number">#{issue.number}</span>
                        <span className="issue-title">{issue.title}</span>
                        <span className={`issue-state issue-state--${issue.state}`}>{issue.state}</span>
                      </div>
                      <div className="issue-row-right">
                        <span className="issue-author">{issue.author}</span>
                        <span className="issue-date">{new Date(issue.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="issue-comments">{issue.comments} comments</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {activeTab === "pull-request" && (
                <div className="pulls-div">
                  {pullsLoading && <div className="pulls-loading">Loading pull requests...</div>}
                  {!pullsLoading && pulls.length === 0 && (
                    <div className="pulls-empty">No open pull requests, or no repo linked.</div>
                  )}
{!pullsLoading && pulls.map(pr => (
                    <a key={pr.number} href={pr.url} target="_blank" rel="noreferrer" className="pull-row">
                      <div className="pull-row-left">
                        <span className="pull-number">#{pr.number}</span>
                        <span className="pull-title">{pr.title}</span>
                        <span className={`pull-state pull-state--${pr.state}`}>{pr.state}</span>
                      </div>
                      <div className="pull-row-right">
                        <span className="pull-author">{pr.author}</span>
                        <span className="pull-date">{new Date(pr.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}

            </div>

          </div>

          {/* Right side bar */}
          {/* before join */}
          {!isMember && !isOwner &&
            (
              <div className="right-content">

                <div className="collaborators-div">
                  <div className="hader-coll">
                    <div className="coll-title">
                      <div className="coll-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#2d54ef" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <span>Contributors</span>
                    </div>
                    <a href="#" className='view-all-link'>
                      {"View all ->"}
                    </a>
                  </div>

                  <div className="coll-profiles">
                    <div className="profile-1"><span>K</span></div>
                    <div className="profile-2"><span>I</span></div>
                    <div className="profile-3"><span>S</span></div>
                    <div className="profile-4"><span>G</span></div>
                    <div className="profile-add"><span>+1</span></div>
                  </div>

                  <div className="member-container">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#909392" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="member-number">
                      {project.members?.length || 0}/{project.team_size || '?'}
                      <span className='ml-1 text-gray-400'>Contributors</span>
                    </span>
                  </div>
                </div>

                <div className="open-roles-div">
                  <div className="hader-open">
                    <div className="open-title">
                      <div className="open-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />

                          <line x1="3" y1="10" x2="21" y2="10" />

                          <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                          <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                          <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                          <line x1="8" y1="18" x2="8.01" y2="18" strokeWidth="2.5" />
                          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
                          <line x1="16" y1="18" x2="16.01" y2="18" strokeWidth="2.5" />
                        </svg>
                      </div>
                      <span>Open Roles</span>
                    </div>
                    <a href="#" className='view-all-link'>
                      {"View all ->"}
                    </a>
                  </div>
                  <div className="roles-container">

                    <div className="role-1">
                      <div className="left-role">
                        <div className="logo-role-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#264eb3" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </div>
                        <div className="role-info">
                          <div className="role-title">
                            Frontend Developer
                          </div>
                          <div className="role-skill-req">
                            React,Tailwind CSS
                          </div>
                        </div>
                      </div>
                      <div className="right-role">
                        <div className="spot-div">
                          <span>2 spots</span>
                        </div>
                      </div>
                    </div>
                    <div className="role-2">
                      <div className="left-role">
                        <div className="logo-role-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0b3f98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h5M5 12l5-5M5 12l5 5M10 7l4 5M10 17l4-5M14 12h5" />

                            <circle cx="5" cy="12" r="2" fill="#FFF" />

                            <circle cx="10" cy="7" r="2" fill="#FFF" />
                            <circle cx="10" cy="17" r="2" fill="#FFF" />

                            <circle cx="14" cy="12" r="2" fill="#FFF" />
                            <circle cx="19" cy="12" r="2" fill="#FFF" />
                          </svg>

                        </div>
                        <div className="role-info">
                          <div className="role-title">
                            ML Engineer
                          </div>
                          <div className="role-skill-req">
                            Python,Scikit-learn,Pandas
                          </div>
                        </div>
                      </div>
                      <div className="right-role">
                        <div className="spot-div">
                          <span>1 spots</span>
                        </div>
                      </div>
                    </div>
                    <div className="role-3">
                      <div className="left-role">
                        <div className="logo-role-3">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#806606" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeDasharray="2 2" />

                            <rect x="8" y="7" width="14" height="15" rx="2" />

                            <line x1="11" y1="11" x2="19" y2="11" />
                            <line x1="11" y1="15" x2="15" y2="15" />

                            <polygon points="4 7 11 11 8 12 7 15" fill="#FFF" />
                          </svg>


                        </div>
                        <div className="role-info">
                          <div className="role-title">
                            UI/UX Designer
                          </div>
                          <div className="role-skill-req">
                            Figma,Design System
                          </div>
                        </div>
                      </div>
                      <div className="right-role">
                        <div className="spot-div">
                          <span>1 spots</span>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>

                <div className="your-match-div">
                  <div className="hader-match">
                    <div className="match-title">
                      <div className="match-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>

                      </div>
                      <span>Match Your Score</span>
                    </div>
                    <a href="#" className='view-all-link'>
                      {"View all ->"}
                    </a>
                  </div>
                  <div className="main-match">
                    <div className="donut-chart-div">
                      <svg width="120" height="120" viewBox="0 0 140 140">
                        {/* Background Ring */}
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          fill="none"
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth={strokeWidth}
                        />

                        {/* Segments */}
                        {(() => {
                          let accumulatedLength = 0;

                          return segments1.map((segment, index) => {
                            const gap = 4;

                            const segmentLength =
                              (segment.value / 100) * circumference - gap;

                            const circle = (
                              <circle
                                key={index}
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={`${segmentLength} ${circumference}`}
                                strokeDashoffset={-accumulatedLength}
                                transform="rotate(-90 70 70)"
                              />
                            );

                            accumulatedLength +=
                              (segment.value / 100) * circumference;

                            return circle;
                          });
                        })()}
                      </svg>

                      <div className="chart-content">
                        <h2>{percentage1}%</h2>
                        <p>Excellent Match</p>
                      </div>
                    </div>
                    <div className="match-scale">
                      <div className="segment-1 mt-10 flex items-center">
                        <div className="dot-1 w-2 h-2 rounded-full bg-[#10B981]"></div>
                        <span className='ml-2 text-[10px]'>Skills Match</span>
                      </div>
                      <div className="segment-2 flex items-center">
                        <div className="dot-2  w-2 h-2 rounded-full bg-[#f6d25c]"></div>
                        <span className='ml-2 text-[10px]'>Experience Match</span>
                      </div>
                      <div className="segment-3 flex items-center">
                        <div className="dot-3  w-2 h-2 rounded-full bg-[#3B82F6]"></div>
                        <span className='ml-2 text-[10px]'>Activity Match</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="project-health-div">
                  <div className="hader-health">
                    <div className="health-title">
                      <div className="health-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} className="w-full h-full"
                          viewBox="0 0 500 500"
                          preserveAspectRatio="xMidYMid meet">
                          <path
                            d="M0 0 C0.84433594 0.76570313 1.68867188 1.53140625 2.55859375 2.3203125 C4.77420686 4.23300883 4.77420686 4.23300883 6.92382812 3.80297852 C9.38296863 2.85188337 10.75227945 1.64681634 12.66015625 -0.16796875 C36.583287 -21.80745271 70.26872722 -32.14875309 102.02416992 -32.24023438 C104.03381271 -32.24986256 106.043315 -32.28102598 108.05273438 -32.3125 C138.52274106 -32.43204882 165.1346994 -19.62124039 187 1 C187.60328125 1.55042969 188.2065625 2.10085937 188.828125 2.66796875 C214.57385914 27.03017045 226.8731707 63.26676731 228 98 C228.58799834 135.58044421 213.84425056 170.90085995 188.01953125 197.89453125 C187.01456956 198.93119112 186.0080768 199.96636909 185 201 C184.51321777 201.50192871 184.02643555 202.00385742 183.52490234 202.52099609 C179.24464402 206.91939012 174.92369469 211.22498371 170.265625 215.2265625 C165.43848204 219.41652259 160.98152538 223.94654002 156.5 228.5 C151.48072491 233.59984131 146.43954375 238.55183483 141.00976562 243.21289062 C137.1669081 246.63000884 133.60391313 250.33458665 130 254 C121.57808043 262.56563834 121.57808043 262.56563834 117.03125 266.46875 C112.26833486 270.56202757 107.90285874 275.02646937 103.5 279.5 C98.49079531 284.58960926 93.45977219 289.53004601 88.04101562 294.18164062 C84.01503106 297.76842688 80.28078502 301.65852822 76.5 305.5 C71.48072491 310.59984131 66.43954375 315.55183483 61.00976562 320.21289062 C57.1669081 323.63000884 53.60391313 327.33458665 50 331 C45.07377986 336.01028533 40.10850704 340.85752923 34.77734375 345.43652344 C32.38405763 347.54182622 30.19662514 349.8170594 28 352.125 C21.3061996 358.89088748 15.46534417 363.04784771 5.8125 363.3125 C-8.78628101 363.08015866 -17.66211224 351.52135869 -27.18261719 341.78149414 C-29.93975807 338.97683138 -32.75454277 336.31670983 -35.7421875 333.7578125 C-41.9031136 328.43266525 -47.50948956 322.5334159 -53.22265625 316.73828125 C-57.05486605 312.87260237 -60.86411087 309.04206076 -65 305.5 C-71.09140264 300.28319713 -76.59653402 294.4451226 -82.22265625 288.73828125 C-86.0522792 284.87521181 -89.85856444 281.04688051 -93.9921875 277.5078125 C-99.15395498 273.08754324 -103.85669807 268.21103349 -108.625 263.375 C-113.91800743 258.00744317 -119.13615203 252.74118088 -125 248 C-127.87967791 244.44839725 -128.58206344 241.41175338 -128.4296875 236.93359375 C-127.69290432 233.61806942 -125.58205555 232.02875793 -123 230 C-119.89046621 228.4452331 -117.43733239 228.71355563 -114 229 C-109.31145561 231.39415033 -105.91417305 234.93425557 -102.3203125 238.70703125 C-100.39867456 240.60602363 -98.44813858 242.35072971 -96.3984375 244.10546875 C-90.19697292 249.48519973 -84.53728393 255.41913954 -78.77734375 261.26171875 C-74.94513395 265.12739763 -71.13588913 268.95793924 -67 272.5 C-60.90859736 277.71680287 -55.40346598 283.5548774 -49.77734375 289.26171875 C-45.94513395 293.12739763 -42.13588913 296.95793924 -38 300.5 C-31.90859736 305.71680287 -26.40346598 311.5548774 -20.77734375 317.26171875 C-16.21353578 321.86538531 -11.6090328 326.31849163 -6.68408203 330.53417969 C-3.86716498 332.98601645 -1.33373782 335.6959915 1.23828125 338.3984375 C3.01353029 340.22904557 3.01353029 340.22904557 6 341 C7.88882396 339.80580629 7.88882396 339.80580629 9.72265625 337.9921875 C10.78250732 337.01523926 10.78250732 337.01523926 11.86376953 336.01855469 C12.92120361 335.01937012 12.92120361 335.01937012 14 334 C15.22774433 332.87747263 16.45560455 331.75507199 17.68359375 330.6328125 C18.93691116 329.46570211 20.1881446 328.29635061 21.4375 327.125 C22.45360352 326.17367187 22.45360352 326.17367187 23.49023438 325.203125 C29.47672633 319.56232415 35.29994254 313.76613772 41.06420898 307.89892578 C44.24086017 304.68152342 47.44229497 301.56928407 50.875 298.625 C55.84443727 294.34468391 60.39983582 289.66986364 65 285 C74.48538992 275.37089205 74.48538992 275.37089205 78.96875 271.53125 C84.09182794 267.13857072 88.76514747 262.30278441 93.5 257.5 C98.8440751 252.07925237 104.18065411 246.76647975 109.96289062 241.81445312 C114.16307206 238.07335193 118.05428894 234.00549456 122 230 C127.20315287 224.71801148 132.41335535 219.56300191 138.04394531 214.73779297 C142.42768033 210.84320662 146.44458299 206.55072441 150.52734375 202.34570312 C151.20667969 201.65541016 151.88601563 200.96511719 152.5859375 200.25390625 C153.1948584 199.62814697 153.8037793 199.0023877 154.43115234 198.35766602 C156 197 156 197 158 197 C158.25394531 196.40832031 158.50789063 195.81664062 158.76953125 195.20703125 C160.13553212 192.7569027 161.52936211 191.4640418 163.6875 189.6875 C187.10707899 170.30416107 201.11626735 141.98857005 204.6875 112 C207.05584345 81.70493998 199.33156011 52.35982314 181 28 C178.87871446 25.51911298 176.71972003 23.10570603 174.46875 20.7421875 C173 19 173 19 173 17 C172.11634766 16.60167969 172.11634766 16.60167969 171.21484375 16.1953125 C168.94187646 14.96863174 167.42206649 13.6558766 165.5625 11.875 C145.48415714 -5.97653958 120.07526726 -11.36217612 94 -10 C88.24378682 -9.43944363 82.62410252 -8.32533447 77 -7 C75.81148438 -6.7215625 74.62296875 -6.443125 73.3984375 -6.15625 C53.30445249 -0.89461961 33.12226883 9.35406557 18.625 24.375 C14.5074296 28.61093998 10.95978848 31.25483362 4.875 31.375 C-1.67922902 30.34987932 -5.75970216 25.06918103 -10.28857422 20.63085938 C-30.09874361 1.75326572 -56.6443804 -15.50313012 -84.82421875 -15.15234375 C-110.58124499 -13.91676685 -134.39072251 -4.81300868 -154 12 C-154.61101562 12.47824219 -155.22203125 12.95648438 -155.8515625 13.44921875 C-176.56446585 29.95333581 -188.50859362 58.26823335 -192.609375 83.79296875 C-193.34139833 90.29198594 -193.28258252 96.88660512 -193.34179688 103.41992188 C-193.55260947 111.25920875 -193.55260947 111.25920875 -195.91796875 115.17578125 C-199.47556469 118.29284936 -202.14569814 118.35081965 -206.7421875 118.26953125 C-210.27603921 117.84767006 -211.75189949 116.72497032 -214 114 C-222.29724851 91.08378983 -211.62088729 59.46837392 -202.14746094 38.375 C-185.77516651 4.48783399 -155.78796691 -19.17461411 -121 -32 C-117.02418489 -33.30210262 -113.11658878 -34.26607734 -109 -35 C-107.37191406 -35.30357422 -107.37191406 -35.30357422 -105.7109375 -35.61328125 C-63.67833819 -42.3439916 -31.42920925 -26.26766432 0 0 Z "
                            fill="#000000"
                            transform="translate(250,93)"
                          />
                          <path
                            d="M0 0 C0.77085937 0.05542969 1.54171875 0.11085937 2.3359375 0.16796875 C5.48048926 1.05338008 6.55079834 2.2749236 8.625 4.8125 C9.59321624 7.49484606 10.36392436 10.01477173 11.04589844 12.76708984 C11.25346645 13.55839987 11.46103447 14.34970989 11.67489243 15.16499901 C12.3387065 17.71083293 12.982557 20.26119803 13.625 22.8125 C14.05027942 24.46419266 14.47642241 26.11566322 14.90344238 27.76690674 C16.25478778 33.01874582 17.57439036 38.2783321 18.890625 43.5390625 C19.37426381 45.46716917 19.85796877 47.39525925 20.34173584 49.32333374 C21.34503648 53.32468178 22.3464496 57.32649665 23.34667969 61.32861328 C24.6251137 66.44255423 25.91006581 71.55483358 27.19659805 76.66674232 C28.19326043 80.63113484 29.18563387 84.59659178 30.17681122 88.56235886 C30.64893108 90.44848933 31.12256497 92.33424153 31.59778595 94.21959305 C32.26011489 96.84923365 32.91641966 99.48030969 33.57128906 102.11181641 C33.76555481 102.87764038 33.95982056 103.64346436 34.15997314 104.43249512 C35.34213219 109.2164537 36.09801855 113.91167635 36.625 118.8125 C39.92515459 115.7324728 41.76482589 112.09620661 43.8125 108.125 C44.20977295 107.36533936 44.6070459 106.60567871 45.01635742 105.82299805 C47.55180964 100.95357647 50.0073761 96.04755867 52.4375 91.125 C55.79471969 84.33942574 59.33557917 77.65865388 62.9375 71 C63.71154175 69.55717651 63.71154175 69.55717651 64.5012207 68.08520508 C64.99195068 67.18439209 65.48268066 66.2835791 65.98828125 65.35546875 C66.42438721 64.55133545 66.86049316 63.74720215 67.30981445 62.91870117 C68.6040885 60.84598867 69.72394596 59.34399455 71.625 57.8125 C75.7090564 56.89029372 78.2893845 56.36729483 82.25 57.6875 C89.24474903 63.94595966 93.44124025 73.59328687 97.9375 81.6875 C98.56978516 82.81414062 99.20207031 83.94078125 99.85351562 85.1015625 C104.49245092 93.41485276 104.49245092 93.41485276 105.625 96.8125 C107.58505981 96.78893433 107.58505981 96.78893433 109.5847168 96.76489258 C114.43947164 96.7105328 119.29419964 96.67612774 124.14916992 96.64770508 C126.24915086 96.63263228 128.3491004 96.61217059 130.44897461 96.58618164 C133.46996824 96.54973246 136.49054511 96.53275841 139.51171875 96.51953125 C140.44835861 96.50404739 141.38499847 96.48856354 142.35002136 96.47261047 C148.4163892 96.47104938 151.88818613 97.26443191 156.4375 101.5 C158.18444112 104.90193797 158.4367444 108.12674164 157.625 111.8125 C155.1875 114.75 155.1875 114.75 152.625 116.8125 C152.295 117.1425 151.965 117.4725 151.625 117.8125 C149.87238242 117.9323499 148.11496247 117.98267422 146.35839844 118.00537109 C144.67094513 118.02946548 144.67094513 118.02946548 142.94940186 118.05404663 C137.79001583 118.0983363 132.63072039 118.1400201 127.47119141 118.16259766 C124.07350514 118.17921672 120.67679443 118.22396235 117.27947617 118.2749691 C114.03538766 118.31679296 110.79118946 118.32378661 107.546875 118.3359375 C106.32901306 118.35860687 105.11115112 118.38127625 103.85638428 118.40463257 C95.41960377 118.38349543 95.41960377 118.38349543 91.49829102 115.56567383 C90.88010498 114.65712646 90.26191895 113.7485791 89.625 112.8125 C89.10446045 112.06009033 88.5839209 111.30768066 88.04760742 110.5324707 C87.39562378 109.39684692 87.39562378 109.39684692 86.73046875 108.23828125 C86.25029297 107.40619141 85.77011719 106.57410156 85.27539062 105.71679688 C84.79263672 104.86150391 84.30988281 104.00621094 83.8125 103.125 C83.31041016 102.25810547 82.80832031 101.39121094 82.29101562 100.49804688 C78.625 94.08875425 78.625 94.08875425 78.625 91.8125 C77.965 91.8125 77.305 91.8125 76.625 91.8125 C76.36203125 92.50085938 76.0990625 93.18921875 75.828125 93.8984375 C74.48387551 97.1543145 72.95869217 100.29392441 71.375 103.4375 C70.86815674 104.44611084 70.86815674 104.44611084 70.35107422 105.47509766 C64.54700387 116.97486882 58.61339979 128.40782956 52.625 139.8125 C52.12049316 140.77833008 51.61598633 141.74416016 51.09619141 142.73925781 C49.76670396 145.27209363 48.41899258 147.79404857 47.0625 150.3125 C46.68174316 151.04130371 46.30098633 151.77010742 45.90869141 152.52099609 C43.7110118 156.53690685 41.87097882 158.97823715 37.625 160.8125 C33.9227237 161.20917246 31.37475195 161.08513707 27.875 159.8125 C22.72086229 155.23104426 21.62064721 146.37327777 20.00537109 139.86401367 C19.76270004 138.90206085 19.52002899 137.94010803 19.27000427 136.94900513 C18.47516544 133.79389411 17.68680985 130.63720115 16.8984375 127.48046875 C16.34505118 125.27937527 15.79122165 123.07839319 15.23696899 120.8775177 C13.78338952 115.10114845 12.33515254 109.32345366 10.88824463 103.54541016 C8.56681076 94.27945466 6.23667842 85.01568143 3.90761185 75.75164223 C3.09466512 72.51521434 2.28364388 69.27830889 1.47299194 66.04130554 C0.97729609 64.06553619 0.48157985 62.08977195 -0.01416016 60.11401367 C-0.23962021 59.21164474 -0.46508026 58.30927582 -0.69737244 57.37956238 C-0.90476547 56.55399841 -1.11215851 55.72843445 -1.32583618 54.87785339 C-1.50537653 54.16094928 -1.68491688 53.44404516 -1.86989784 52.70541668 C-2.30983512 51.05671137 -2.83539144 49.43132569 -3.375 47.8125 C-3.57607864 48.32661438 -3.77715729 48.84072876 -3.98432922 49.37042236 C-4.60232339 50.95046347 -5.22034261 52.53049478 -5.83837891 54.11051941 C-6.57471195 55.99306419 -7.31095606 57.87564375 -8.04711914 59.758255 C-10.08691223 64.97392747 -12.12881204 70.18875993 -14.17456055 75.40209961 C-17.76774192 84.56297196 -21.35703191 93.72378116 -24.84375 102.92578125 C-25.33905977 104.2231258 -25.83472916 105.52033312 -26.33081055 106.81738281 C-27.21035912 109.12380386 -28.07966747 111.43416639 -28.93676758 113.74902344 C-31.01666204 119.17168251 -32.67665591 123.26629762 -37.375 126.8125 C-39.40234375 127.66015625 -39.40234375 127.66015625 -41.3125 127.875 C-41.94027344 127.96910156 -42.56804687 128.06320312 -43.21484375 128.16015625 C-48.06845 127.37901528 -50.9230787 124.43182736 -53.7265625 120.58984375 C-54.49701992 119.31746731 -55.25421528 118.03699324 -56 116.75 C-56.85320055 115.33144972 -57.70741507 113.91350895 -58.5625 112.49609375 C-59.01109375 111.74440918 -59.4596875 110.99272461 -59.921875 110.21826172 C-62.54618747 105.87350784 -65.27966965 101.59752556 -68 97.3125 C-69.03412064 95.67725182 -70.06799797 94.04184973 -71.1015625 92.40625 C-71.85931974 91.20829838 -72.6171095 90.01036732 -73.375 88.8125 C-77.67501071 93.84098311 -80.86472087 99.4568755 -84.22070312 105.13085938 C-91.16741071 116.70870536 -91.16741071 116.70870536 -95.375 118.8125 C-96.95143675 118.92271356 -98.53236555 118.9715956 -100.11254883 118.98950195 C-101.09729691 119.00233719 -102.08204498 119.01517242 -103.09663391 119.02839661 C-104.16431503 119.03578354 -105.23199615 119.04317047 -106.33203125 119.05078125 C-107.42714523 119.058853 -108.52225922 119.06692474 -109.65055847 119.07524109 C-111.9715313 119.08908904 -114.29252455 119.099808 -116.61352539 119.10766602 C-120.16266483 119.12487955 -123.71087316 119.1687606 -127.25976562 119.21289062 C-129.51301397 119.22301725 -131.76627025 119.23153344 -134.01953125 119.23828125 C-135.61194389 119.26454338 -135.61194389 119.26454338 -137.23652649 119.29133606 C-144.61846461 119.26961381 -144.61846461 119.26961381 -148.5222168 116.91088867 C-151.66995153 113.34588933 -151.70512607 110.68915811 -151.66796875 106.07421875 C-151.23844199 102.7582722 -149.76575646 101.06262373 -147.375 98.8125 C-144.66334307 97.45667153 -142.34163684 97.89968926 -139.38208008 98.08258057 C-120.25414711 99.94482835 -120.25414711 99.94482835 -102.390625 94.98242188 C-97.96979287 90.27932438 -95.70726014 84.65149082 -93.51416016 78.65380859 C-91.68469641 74.09073549 -88.99647774 70.17926089 -86.25 66.125 C-85.79842529 65.4134375 -85.34685059 64.701875 -84.8815918 63.96875 C-82.90672066 60.87545888 -81.46654448 58.87352965 -78.375 56.8125 C-76.2890625 56.4765625 -76.2890625 56.4765625 -74 56.4375 C-73.24976563 56.40914062 -72.49953125 56.38078125 -71.7265625 56.3515625 C-67.52621193 57.17488703 -65.29730861 59.51336922 -62.85839844 62.94873047 C-61.16559578 65.58272316 -59.54259587 68.24919909 -57.9375 70.9375 C-57.11668945 72.28714844 -57.11668945 72.28714844 -56.27929688 73.6640625 C-54.63418009 76.37412471 -53.00288532 79.09205786 -51.375 81.8125 C-50.23834165 83.70576543 -49.10162592 85.59899641 -47.96484375 87.4921875 C-47.10148383 88.9322445 -46.23818886 90.37234045 -45.375 91.8125 C-42.01892386 84.60863305 -38.93031656 77.35195215 -36.08203125 69.93359375 C-35.6940889 68.93064774 -35.30614655 67.92770172 -34.90644836 66.8943634 C-34.08540132 64.77041578 -33.26580063 62.64590854 -32.4475708 60.52087402 C-31.17532154 57.21838732 -29.89760594 53.91805959 -28.61865234 50.61816406 C-25.05933953 41.42556599 -21.50902856 32.23114023 -18.08203125 22.98828125 C-17.63174561 21.78308838 -17.18145996 20.57789551 -16.7175293 19.33618164 C-15.9348505 17.23172204 -15.16322804 15.1230993 -14.40551758 13.00952148 C-11.76247125 5.91828308 -8.56186743 -0.75378567 0 0 Z "
                            fill="#000000"
                            transform="translate(203.375,165.1875)"
                          />
                        </svg>
                      </div>
                      <span>Project Health</span>
                    </div>
                    <a href="#" className='view-all-link'>
                      {"View all ->"}
                    </a>
                  </div>
                  <div className="health-main">
                    <div className="cell-1">
                      <span className="cell-head">Active Contributors</span>
                      <span className="cell-data">{project.members?.length || 0}</span>
                      <span className="cell-msg">↑ 1 this week</span>
                    </div>
                    <div className="cell-2">
                      <span className="cell-head">Open Issues</span>
                      <span className="cell-data">{issues.length}</span>
                      <span className="cell-info">Viewed 2h ago</span>
                    </div>
                    <div className="cell-3">
                      <span className="cell-head">Last Commit</span>
                      <span className=" font-semibold text-[16px]">{lastCommitLabel}</span>
                    </div>
                    <div className="cell-4">
                      <span className="cell-head">Response Time</span>
                      <span className="cell-data">{"<24h"}</span>
                      <span className="cell-msg">Average</span>
                    </div>

                  </div>
                </div>

              </div>
            )
          }
          {/* After joining */}
          {(isMember || isOwner) &&
            (
              <div className="right-content">

                <div className="team-member-div">
                  <div className="hader-coll">
                    <div className="coll-title">
                      <span>Team Members</span>
                    </div>
                    <a href="#" className='view-all-link'>
                      {"View all ->"}
                    </a>
                  </div>

                  <div className="coll-profiles">
                    <div className="profile-1"><span>K</span></div>
                    <div className="profile-2"><span>I</span></div>
                    <div className="profile-3"><span>S</span></div>
                    <div className="profile-4"><span>G</span></div>
                    <div className="profile-add"><span>+1</span></div>
                  </div>

                  <div className="member-container">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#909392" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="member-number">
                      {project.members?.length || 0}/{project.team_size || '?'}
                      <span className='ml-1 text-gray-400'>Contributors</span>
                    </span>
                  </div>
                </div>

                <div className="your-contri-div">
                  <div className="hader-match">
                    <div className="progress-title">
                      <span>Your Contribution Progress</span>
                    </div>
                  </div>
                  <div className="main-match">
                    <div className="donut-chart-div">
                      <svg width="120" height="120" viewBox="0 0 140 140">
                        {/* Background Ring */}
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          fill="none"
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth={strokeWidth}
                        />

                        {/* Segments */}
                        {(() => {
                          let accumulatedLength = 0;

                          return segments2.map((segment, index) => {
                            const gap = 4;

                            const segmentLength =
                              (segment.value / 100) * circumference - gap;

                            const circle = (
                              <circle
                                key={index}
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={`${segmentLength} ${circumference}`}
                                strokeDashoffset={-accumulatedLength}
                                transform="rotate(-90 70 70)"
                              />
                            );

                            accumulatedLength +=
                              (segment.value / 100) * circumference;

                            return circle;
                          });
                        })()}
                      </svg>

                      <div className="chart-content">
                        <h2>60%</h2>
                        <p>Overall Progress</p>
                      </div>
                    </div>
                    <div className="match-scale">
                      <div className="segment-1 mt-10 flex items-center">
                        <div className="dot-1 w-2 h-2 rounded-full bg-[#10B981]"></div>
                        <span className='ml-2 text-[10px]'>Task Done</span>
                      </div>
                      <div className="segment-2 flex items-center">
                        <div className="dot-2  w-2 h-2 rounded-full bg-[#f6d25c]"></div>
                        <span className='ml-2 text-[10px]'>Reviews Done</span>
                      </div>
                      <div className="segment-3 flex items-center">
                        <div className="dot-3  w-2 h-2 rounded-full bg-[#3B82F6]"></div>
                        <span className='ml-2 text-[10px]'>PRs Merged</span>
                      </div>
                      <div className="segment-3 flex items-center">
                        <div className="dot-3  w-2 h-2 rounded-full bg-[#df6a21]"></div>
                        <span className='ml-2 text-[10px]'>Issues Completed</span>
                      </div>
                    </div>
                  </div>
                  <button className="view-detail-div">
                    <span className="view-all-link">
                      {"View Detailed Progress ->"}
                    </span>
                  </button>
                </div>

                <div className="upcoming-task-div">
                  <div className="hader-task">
                    <div className="task-title">
                      <span>Upcoming Tasks</span>
                    </div>
                    <a href="#" className='view-all-link'>
                      {"View all ->"}
                    </a>
                  </div>
                  <div className="header-main">
                    {/* row-1 */}
                    <div className="row">
                      <div className="left-row">
                        <div className="no-div">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />

                              <line x1="3" y1="10" x2="21" y2="10" />

                              <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                              <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                              <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                              <line x1="8" y1="18" x2="8.01" y2="18" strokeWidth="2.5" />
                              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
                              <line x1="16" y1="18" x2="16.01" y2="18" strokeWidth="2.5" />
                            </svg>
                          <span className="no">#48</span>
                        </div>
                        <div className="task-info">Add data export functionality</div>
                      </div>
                      <div className="right-row">
                        <div className="inpro-tag">In Progress</div>
                      </div>
                    </div>
                    {/* row-2 */}
                    <div className="row">
                      <div className="left-row">
                        <div className="no-div">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />

                              <line x1="3" y1="10" x2="21" y2="10" />

                              <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                              <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                              <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                              <line x1="8" y1="18" x2="8.01" y2="18" strokeWidth="2.5" />
                              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
                              <line x1="16" y1="18" x2="16.01" y2="18" strokeWidth="2.5" />
                            </svg>
                          <span className="no">#48</span>
                        </div>
                        <div className="task-info">Improve model accuracy</div>
                      </div>
                      <div className="right-row">
                        <div className="to-do-tag">To-Do</div>
                      </div>
                    </div>
                    {/* row-3 */}
                    <div className="row">
                      <div className="left-row">
                        <div className="no-div">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />

                              <line x1="3" y1="10" x2="21" y2="10" />

                              <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5" />
                              <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5" />
                              <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5" />
                              <line x1="8" y1="18" x2="8.01" y2="18" strokeWidth="2.5" />
                              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
                              <line x1="16" y1="18" x2="16.01" y2="18" strokeWidth="2.5" />
                            </svg>
                          <span className="no">#48</span>
                        </div>
                        <div className="task-info">UI:Student performance insight</div>
                      </div>
                      <div className="right-row">
                        <div className="to-do-tag">To-Do</div>
                      </div>
                    </div>
                  </div>
                  <button className="view-detail-div">
                    <span className="view-all-link">
                      {"View Detailed Progress ->"}
                    </span>
                  </button>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail;