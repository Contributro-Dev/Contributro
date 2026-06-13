import { useParams } from 'react-router-dom'
import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getProject, joinProject } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import { useNavigate } from 'react-router-dom'
import "./ProjectDetail.css";
import codeIcon from "../assets/project-icon.png"

function ProjectDetail() {

  const { login, user, token, logout } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const [showFullDesc, setShowFullDesc] = useState(false)

  const navigate = useNavigate()

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true)
  const [isPending, setIsPending] = useState(false)

  const [activeTab, setActiveTab] = useState("overview")

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


  const percentage = 98;

  const radius = 55;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const offset = circumference - progress;


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
                        <button className="view-issue-btn">
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
                        <button className="create-pull-btn">
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
                      <button className="view-issue-btn">
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
                      <button className="create-pull-btn">
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

                    <text x="35" y="98" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#333333">MD</text>
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
                <span className='w-4 h-4 text-[9px] bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600'>12</span>
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
                <div className={`pull-request-btn { ${activeTab === "pull-request" ? "tab-active" : ""}`} onClick={() => setActiveTab("pull-request")}>
                  <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 640 640"><path d="M392 88C392 78.3 386.2 69.5 377.2 65.8C368.2 62.1 357.9 64.2 351 71L295 127C285.6 136.4 285.6 151.6 295 160.9L351 216.9C357.9 223.8 368.2 225.8 377.2 222.1C386.2 218.4 392 209.7 392 200L392 176L416 176C433.7 176 448 190.3 448 208L448 422.7C419.7 435 400 463.2 400 496C400 540.2 435.8 576 480 576C524.2 576 560 540.2 560 496C560 463.2 540.3 435 512 422.7L512 208C512 155 469 112 416 112L392 112L392 88zM136 144C136 130.7 146.7 120 160 120C173.3 120 184 130.7 184 144C184 157.3 173.3 168 160 168C146.7 168 136 157.3 136 144zM192 217.3C220.3 205 240 176.8 240 144C240 99.8 204.2 64 160 64C115.8 64 80 99.8 80 144C80 176.8 99.7 205 128 217.3L128 422.6C99.7 434.9 80 463.1 80 495.9C80 540.1 115.8 575.9 160 575.9C204.2 575.9 240 540.1 240 495.9C240 463.1 220.3 434.9 192 422.6L192 217.3zM136 496C136 482.7 146.7 472 160 472C173.3 472 184 482.7 184 496C184 509.3 173.3 520 160 520C146.7 520 136 509.3 136 496zM480 472C493.3 472 504 482.7 504 496C504 509.3 493.3 520 480 520C466.7 520 456 509.3 456 496C456 482.7 466.7 472 480 472z" /></svg>
                  <span>Pull Request</span>
                  <span className='w-4 h-4 text-[9px] bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600'>5</span>
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
                            <span>1 day ago</span>
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
                            <a href="#">github.com/kaivalyakulkarni/
                              student-performance-analysis
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />

                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>

                            </a>
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
                      <svg width="140" height="140" viewBox="0 0 140 140">
                        <defs>
                          <linearGradient id="matchGradient">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#6d28d9" />
                          </linearGradient>
                        </defs>

                        {/* Background */}
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          fill="none"
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth={strokeWidth}
                        />

                        {/* Progress */}
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          fill="none"
                          stroke="url(#matchGradient)"
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          transform="rotate(-90 70 70)"
                        />
                      </svg>

                      <div className="chart-content">
                        <h2>{percentage}%</h2>
                        <p>Excellent Match</p>
                      </div>
                    </div>
                    <div className="match-scale"></div>
                  </div>
                </div>

                <div className="project-health-div"></div>

              </div>
            )
          }
          {/* After joining */}
          {(isMember || isOwner) &&
            (
              <div className="right-content">

                <div className="team-member-div"></div>

                <div className="your-contri-div"></div>

                <div className="upcoming-task-div"></div>

                <div className="project-activity-div"></div>

              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail;