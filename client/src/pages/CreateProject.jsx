import { useEffect, useContext, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getUser } from "../services/authServices.js";
import { createProject } from "../services/projectServices.js";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

import "./CreateProject.css"


function CreateProject() {

  const { user, token, logout } = useContext(AuthContext)

  const [skillInput, setSkillInput] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)


  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U"

  const [formData, setFormData] = useState({
    title: '',
    description: '',  // also fix the typo — 'descreption'
    required_skills: [],
    team_size: '',
    timeline: '',
    github_repo: ''
  })


  const handleSkillAdd = () => {
    if (skillInput === '') return
    if (formData.required_skills.includes(skillInput)) return

    setFormData(prev => ({
      ...prev,
      required_skills: [...prev.required_skills, skillInput]
    }))
    setSkillInput('')
  }

  const handleSkillRemove = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(
        (_, index) => index !== indexToRemove
      )
    }));
  };

  const navigate = useNavigate()

  const handleSubmit = () => {
    createProject(formData, token)
      .then(() => {
        setFormData({
          title: '',
          description: '',
          required_skills: [],
          team_size: '',
          timeline: '',
          github_repo: ''
        })
        navigate('/explore')
      })
      .catch(error => {
        console.error(error)
      })
      console.log('token:', token)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: '#fff', color: '#000' }}>

      <Sidebar activePage="create-project" />
      <div className="create-project-container" >

        {/* nav */}
        <div className="create-project-nav">
          <input type="text" placeholder="Search projects, skills, or users..." className="search-bar" />
          <div className="nav-right">
            <button className="theme-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
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

        {/* Center - form */}
        <div className="center-form">
          {/* form */}
          <div className="form">
            <div className="form-header">
              <div className="back-to-projects">
                <a href="/explore"  >{"<-"}</a>
                <span className="ml-2"> Back To Projects</span>
              </div>
              <span className="form-title">Create New Project</span>
              <span className="form-msg">Fill in the details below to create your project and find amazing collaborators.</span>
            </div>

            <div className="form-content">
              {/* Title */}
              <div className="project-title-section">
                <span className="project-title">
                  Project Title
                  <span className="text-red-500 ml-1">*</span>
                </span>
                <div className="title-input">
                  <input
                    type="text"
                    value={formData.title}
                    maxLength={100}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a catchy title for your project"
                  />
                  <span className="text-xs text-gray-400">{formData.title.length}/100</span>
                </div>
              </div>
              {/* Desc */}
              <div className="project-desc-section">
                <span className="project-desc">
                  Description
                  <span className="text-red-500 ml-1">*</span>
                </span>
                <div className="desc-input">
                  <textarea
                    type="text"
                    value={formData.description}
                    maxLength={1000}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your project, its goals, features, and what makes it impactful..."
                  />
                  <span className="text-xs text-gray-400">{formData.description.length}/1000</span>
                </div>
              </div>
              {/* Required -skills */}
              <div className="project-title-section">
                <span className="project-title">
                  Required Skills
                  <span className="text-red-500 ml-1">*</span>
                </span>
                <div className="title-input">
                  <input
                    type="text"
                    maxLength={50}
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSkillAdd()}
                    placeholder="Add skills required for this project"
                  />
                </div>
                <span className="text-[10px] text-gray-400 ml-1">Press Enter to add skill</span>
                <div className="skills-section">
                  <div className="skill-tags">
                    {formData.required_skills.map((skill, index) => {
                      return (
                        <div key={index} className="skill-tag">
                          <span>{skill}</span>
                          <button className="delete-x" onClick={() => handleSkillRemove(index)}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <path d="M18 6L6 18" />
                              <path d="M6 6L18 18" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-gray-500">{formData.required_skills.length}/10 skills</span>
                </div>
              </div>

              {/* team-size , timeline , git-repo-link */}
              <div className="ttg-section">
                <div className="team-size-section">
                  <span className="team-size-title">
                    Team Size
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                  <div className="team-input">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <input
                      type="number"
                      value={formData.team_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, team_size: e.target.value }))}
                      placeholder="e.g. 3-5"
                      className="no-spinners"
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 ml-1">How many people do you need?</span>

                </div>
                <div className="timeline-section">
                  <span className="timeline-title">
                    Timeline
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                  <div className="timeline-input">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#374151"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <select
                      className="custom-select"
                      value={formData.timeline}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                    >
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="1 year">1 year</option>
                      <option value="open-ended">open-ended</option>
                    </select>
                  </div>
                  <span className="text-[11px] text-gray-400 ml-1">Expected project duration</span>

                </div>
                <div className="git-repo-link-section">
                  <span className="git-repo-link-title">
                    GitHub Repositiory
                  </span>
                  <div className="git-url-input">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#374151"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 5" />
                      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 19" />
                    </svg>
                    <input
                      type="url"
                      value={formData.github_repo}
                      onChange={(e) => setFormData(prev => ({ ...prev, github_repo: e.target.value }))}
                    />

                  </div>
                  <span className="text-[11px] text-gray-400 ml-1">Link to existed repository {"(Optional)"}</span>

                </div>
              </div>

              {/* cancel , createproject btns */}
              <div className="btns-section">
                <button
                  className="cancel-btn"
                  onClick={() => navigate(-1)}
                >Cancel</button>
                <button
                  className="create-project-btn"
                  onClick={handleSubmit}
                >
                  <span className="mr-2">+</span>
                  Create Project
                </button>
              </div>

            </div>
          </div>
          {/* Right Panel */}
          <div className="create-project-right">
            <div className="right-section">
              <div className="right-section-header">
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ffff9eb0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M12 2a6 6 0 0 0-4 10.5c1 1 1.5 2 1.5 3.5h5c0-1.5.5-2.5 1.5-3.5A6 6 0 0 0 12 2z" />
                  </svg>
                </span>
                <span className="right-section-title">Tips for a Great Project</span>
              </div>
              {[
                {
                  icon:
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="9" cy="9" r="1.5" />
                      <path d="M21 15l-5-5-8 8" />
                    </svg>
                  , title: "Clear Title", desc: "Make it short, descriptive, and attention-grabbing."
                },
                {
                  icon:
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  , title: "Detailed Description", desc: "Explain the problem, solution, and impact of your project."
                },
                {
                  icon:
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M15 4V2" />
                      <path d="M15 10V8" />
                      <path d="M12 7h2" />
                      <path d="M16 7h2" />
                      <path d="M4 20l10-10" />
                      <path d="M11 3l10 10" />
                    </svg>
                  , title: "Right Skills", desc: "Add relevant skills to attract the right contributors."
                },
                {
                  icon:
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  , title: "Realistic Timeline", desc: "Be realistic about the time commitment required."
                },
                {
                  icon:
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#000"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 5" />
                      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 19" />
                    </svg>
                  , title: "Open Source First", desc: "Add a GitHub repo to showcase your work transparently."
                },
              ].map((tip, i) => (
                <div className="tip-item" key={i}>
                  <div className="tip-icon">{tip.icon}</div>
                  <div className="tip-info">
                    <span className="tip-title">{tip.title}</span>
                    <span className="tip-desc">{tip.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="right-section">
              <div className="right-section-header">
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="5" y="4" width="14" height="17" rx="2" />
                    <path d="M9 2h6v4H9z" />
                    <path d="M9 10h6" />
                    <path d="M9 14h6" />
                  </svg>
                </span>
                <span className="right-section-title">Project Guidelines</span>
              </div>
              {[
                "Be respectful and inclusive",
                "Follow open source best practices",
                "Provide clear contribution guidelines",
                "Maintain active communication",
                "Give proper credit to contributors",
              ].map((g, i) => (
                <div className="guideline-item" key={i}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="10" cy="10" r="8" />
                    <path d="M7 10l2 2 4-4" />
                  </svg>
                  <span className="guideline-text">{g}</span>
                </div>
              ))}
              <a className="view-all-link" style={{ marginTop: '8px' }}>View Community Guidelines →</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CreateProject;