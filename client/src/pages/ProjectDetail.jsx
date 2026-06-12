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
                    <path d="M20,10 L70,10 L90,30 L90,110 L20,110 Z" fill="#ffffff" stroke="#333333" stroke-width="3" stroke-linejoin="round" />

                    <path d="M70,10 L70,30 L90,30" fill="#f0f0f0" stroke="#333333" stroke-width="3" stroke-linejoin="round" />

                    <line x1="35" y1="45" x2="75" y2="45" stroke="#333333" stroke-width="3" stroke-linecap="round" />
                    <line x1="35" y1="60" x2="75" y2="60" stroke="#888888" stroke-width="3" stroke-linecap="round" />
                    <line x1="35" y1="75" x2="60" y2="75" stroke="#888888" stroke-width="3" stroke-linecap="round" />

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
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e9660e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <span>Data Processing and analysis</span>
                        </div>
                        <div className="bullet">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <span>Predivtive Model for student performance</span>
                        </div>
                        <div className="bullet">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <span>Interactive dashboard for visualization</span>
                        </div>
                        <div className="bullet">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                    <span className="project-detail-title">Project Details</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div className="right-content">

          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail;