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
            <div className="tabs">

            </div>

            <div className="body">

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