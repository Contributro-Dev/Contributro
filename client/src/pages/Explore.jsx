import { useEffect, useContext, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getAllProjects, joinProject } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import { useNavigate } from 'react-router-dom'
import { getRecommendedProjects } from "../services/recommendationServices.js";
import "./Explore.css";

function Explore() {
    const cardsRef = useRef(null)

    const { login, user, token, logout } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [recommendedProjects, setRecommendedProjects] = useState([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false)


    const [showMoreFilters, setShowMoreFilters] = useState(false)
    const [bookmarkedIds, setBookmarkedIds] = useState(() => {
        return JSON.parse(localStorage.getItem('bookmarks') || '[]');
    });

    const toggleBookmark = (projectId, e) => {
        e.stopPropagation();
        setBookmarkedIds(prev => {
            const updated = prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId];
            localStorage.setItem('bookmarks', JSON.stringify(updated));
            return updated;
        });
    };

    const [scrolled, setScrolled] = useState(false)

    const navigate = useNavigate()

    const handleScroll = () => {
        setScrolled(cardsRef.current.scrollLeft > 10)
    }

    const scrollLeft = () => cardsRef.current.scrollBy({ left: -280, behavior: 'smooth' })
    const scrollRight = () => cardsRef.current.scrollBy({ left: 280, behavior: 'smooth' })

    // ─────────────────────────────────────────────
    // Load projects
    // ─────────────────────────────────────────────
    useEffect(() => {
        getAllProjects().then((response) => {
            setProjects(response.data);
        });
    }, []);

    // ─────────────────────────────────────────────
    // Load AI recommendations
    // ─────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        getRecommendedProjects(token).then((response) => {
            setRecommendedProjects(response.data.recommendations);
        }).catch((error) => {
            console.error("Failed to load recommendations:", error);
        });
    }, [token]);

    // ─────────────────────────────────────────────
    // Join project
    // ─────────────────────────────────────────────
    const handleJoinProject = (projectId) => {
        console.log("token:", token)
        console.log("projectId:", projectId)
        joinProject(projectId, token).then(response => {
            console.log(response.data)
            alert(response.data.message);
        }).catch(error => {
            console.error(error);
            alert(error.response.data.message);
        })
    }
    const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
            <Sidebar activePage="explore" />
            <div className="explore-container">
                {/* navbar */}
                <div className="explore-nav">
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

                {/* content */}
                <div className="explore-content">

                    {/* CENTER */}
                    <div className="explore-center">

                        {/* Header + stats */}
                        <div className="explore-header">
                            <div className="header-left">
                                <span className="explore-title">Explore Projects</span>
                                <span className="explore-msg">Find meaningful projects and contribution to open source.</span>
                            </div>
                            <div className="header-right">
                                <div className='create-div' onClick={() => navigate('/create-project')}>
                                    <span className="create-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M12 5V19M5 12H19"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                    <span className="create-label">Create New Project</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs row */}
                        <div className="explore-tabs">
                            <div className="tab">All</div>
                            <div className="tab">AI Recommended</div>
                            <div className="tab">Trending</div>
                            <div className="tab">Newest</div>
                            <div className="tab">Hackathons</div>
                            <div className="tab">Remote</div>
                            <div className="tab">Open Source</div>
                            <div className="tab">Beginner Friendly</div>
                            <div className="tab">More <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="6 9 12 15 18 9" />
                            </svg></div>
                        </div>

                        {/* Bottom — filters + cards */}
                        <div className="explore-bottom">
                            <div className="explore-filters">

                                {/* Header */}
                                <div className="filter-header">
                                    <span>Filters</span>
                                    <a className="filter-clear-btn ">Clear All</a>
                                </div>

                                {/* Skills */}
                                <div className="filter-section">
                                    <span className="filter-section-title">Skills</span>
                                    <div className="filter-search">
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        <input type="text" placeholder="Search skills..." />
                                    </div>
                                    <div className="filter-list">
                                        {[
                                            { name: 'React', count: 128 },
                                            { name: 'Next.js', count: 98 },
                                            { name: 'Node.js', count: 86 },
                                            { name: 'Python', count: 75 },
                                            { name: 'TypeScript', count: 68 },
                                        ].map(skill => (
                                            <label key={skill.name} className="filter-item">
                                                <div className="filter-item-left">
                                                    <input type="checkbox" />
                                                    <span>{skill.name}</span>
                                                </div>
                                                <span className="filter-count">{skill.count}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <span className="filter-show-more">Show more</span>
                                </div>

                                {/* Difficulty */}

                                <div className="filter-section">
                                    <span className="filter-section-title">Difficulty</span>
                                    <div className="filter-list">
                                        {[
                                            { name: 'Beginner', count: 56 },
                                            { name: 'Intermediate', count: 89 },
                                            { name: 'Advanced', count: 28 },
                                        ].map(item => (
                                            <label key={item.name} className="filter-item">
                                                <div className="filter-item-left">
                                                    <input type="checkbox" />
                                                    <span>{item.name}</span>
                                                </div>
                                                <span className="filter-count">{item.count}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Availability */}
                                <div className="filter-section">
                                    <span className="filter-section-title">Availability</span>
                                    <div className="filter-list">
                                        {[
                                            { name: 'Open Positions', count: 112 },
                                            { name: 'Remote Friendly', count: 97 },
                                            { name: 'Actively Maintained', count: 137 },
                                        ].map(item => (
                                            <label key={item.name} className="filter-item">
                                                <div className="filter-item-left">
                                                    <input type="checkbox" />
                                                    <span>{item.name}</span>
                                                </div>
                                                <span className="filter-count">{item.count}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* More Filters */}
                                <div className="filter-section">
                                    <span
                                        className="filter-section-title filter-more-toggle"
                                        onClick={() => setShowMoreFilters(!showMoreFilters)}
                                    >
                                        More Filters
                                        <svg
                                            width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                                            style={{ transform: showMoreFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </span>

                                    {showMoreFilters && (
                                        <div className="more-filters-container">

                                            {/* Project Type */}
                                            <div className="more-filter-group">
                                                <span className="more-filter-label">Project Type</span>
                                                <div className="filter-list">
                                                    {['Open Source', 'Hackathon', 'Startup', 'Research'].map(item => (
                                                        <label key={item} className="filter-item">
                                                            <div className="filter-item-left">
                                                                <input type="checkbox" />
                                                                <span>{item}</span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Team Size */}
                                            <div className="more-filter-group">
                                                <span className="more-filter-label">Team Size</span>
                                                <div className="filter-list">
                                                    {['Solo (1)', 'Small (2-5)', 'Medium (6-10)', 'Large (10+)'].map(item => (
                                                        <label key={item} className="filter-item">
                                                            <div className="filter-item-left">
                                                                <input type="checkbox" />
                                                                <span>{item}</span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Timeline */}
                                            <div className="more-filter-group">
                                                <span className="more-filter-label">Timeline</span>
                                                <div className="filter-list">
                                                    {['Short (< 1 month)', 'Medium (1-3 months)', 'Long (3+ months)'].map(item => (
                                                        <label key={item} className="filter-item">
                                                            <div className="filter-item-left">
                                                                <input type="checkbox" />
                                                                <span>{item}</span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="explore-cards">
                                {/* AI Recomendation */}
                                <div className="recomended-projects-section">
                                    <span className="recomendation-header">
                                        AI Recommended For You
                                        
                                        <a href="#" className="view-all-link" onClick={(e) => { e.preventDefault(); navigate('/recommendations'); }}>View all recomendations {"->"}</a>
                                    </span>
                                    <span className="recomendation-subheader">
                                        projects that match your skills and interests
                                    </span>
                                    <div className="cards-carousel-wrapper">

                                        {scrolled && (
                                            <button className="carousel-btn carousel-btn-left" onClick={scrollLeft}>
                                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                    <polyline points="15 18 9 12 15 6" />
                                                </svg>
                                            </button>
                                        )}
                                        {scrolled && <div className="cards-fade-left" />}

                                        <div className="reconmended-projects-cards" ref={cardsRef} onScroll={handleScroll}>
                                            {recommendedProjects.length === 0 ? (
                                                <p style={{ padding: '12px', color: '#9ca3af' }}>
                                                    No recommendations yet — add some skills to your profile.
                                                </p>
                                            ) : (
                                                recommendedProjects.map(project => {
                                                    const isOwner = project.owner_github_id === String(user?.github_id)
                                                    const isMember = project.members?.includes(String(user?.github_id))
                                                    return (
                                                        <div key={project._id} className="project-card" onClick={() => navigate(`/projects/${project._id}`)}>
                                                            <div className="card-header card-bg-1">
                                                                <div className="icon-wraper" style={{ background: 'linear-gradient(135deg, #393989, #0c0f11)' }}>
                                                                    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <rect x="8" y="24" width="6" height="14" rx="2" fill="#b1c9fe" />
                                                                        <rect x="19" y="16" width="6" height="22" rx="2" fill="#b1c9fe" />
                                                                        <rect x="30" y="10" width="6" height="28" rx="2" fill="#b1c9fe" />
                                                                    </svg>
                                                                </div>
                                                                <button className="bookmark-btn" onClick={(e) => toggleBookmark(project._id, e)}>
                                                                    <svg width="18" height="18" fill={bookmarkedIds.includes(project._id) ? "#fff" : "none"} stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                                                                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                            <div className="card-body">
                                                                <span className="project-card-title">{project.title}</span>
                                                                <span className="project-card-desc">{project.description}</span>
                                                                <div className="project-card-skills">
                                                                    {project.required_skills?.slice(0, 3).map(skill => (
                                                                        <div key={skill} className="skill-tag">{skill}</div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="card-footer">
                                                                <div className="member-container">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2">
                                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                        <circle cx="9" cy="7" r="4" />
                                                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                                    </svg>
                                                                    <span className="member-number">{project.members?.length || 0}/{project.team_size || '?'}</span>
                                                                </div>
                                                                <span className="match-badge">{project.match_score}% match</span>
                                                            </div>
                                                            <div className="join-container">
                                                                {isOwner ? (
                                                                    <button className="join-btn your-project-btn">Your Project</button>
                                                                ) : isMember ? (
                                                                    <button className="join-btn joined-btn">Joined ✓</button>
                                                                ) : (
                                                                    <button className="join-btn" onClick={(e) => { e.stopPropagation(); handleJoinProject(project._id); }}>
                                                                        Join Project
                                                                    </button>
                                                                )}
                                                                <button className="bottom-bookmark-btn" onClick={(e) => toggleBookmark(project._id, e)}>
                                                                    <svg width="18" height="18" fill={bookmarkedIds.includes(project._id) ? "#6366f1" : "none"} stroke="#1d1d1dd1" strokeWidth="1.3" viewBox="0 0 24 24">
                                                                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>

                                        <button className="carousel-btn carousel-btn-right" onClick={scrollRight}>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </button>
                                        {/* fade gradient */}
                                        <div className="cards-fade-right" />
                                    </div>
                                </div>

                                {/* All Projects */}
                                <div className="all-projects-section">

                                    {/* Header row */}
                                    <div className="all-projects-header">
                                        <div className="all-projects-title-group">
                                            <span className="all-projects-title">All Projects</span>
                                            <span className="all-projects-count">{projects.length} projects found</span>
                                        </div>
                                        <div className="all-projects-controls">
                                            <select className="sort-select">
                                                <option>Sort by: Best Match</option>
                                                <option>Sort by: Newest</option>
                                                <option>Sort by: Most Stars</option>
                                                <option>Sort by: Most Members</option>
                                            </select>
                                            <div className="view-toggle">
                                                <button className="view-btn view-btn-active">
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                                        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                                    </svg>
                                                </button>
                                                <button className="view-btn">
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <line x1="3" y1="6" x2="21" y2="6" />
                                                        <line x1="3" y1="12" x2="21" y2="12" />
                                                        <line x1="3" y1="18" x2="21" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cards grid */}
                                    <div className="all-projects-grid">
                                        {projects.map(project => {
                                            const isOwner = project.owner_github_id === String(user?.github_id)
                                            const isMember = project.members?.includes(String(user?.github_id))
                                            return (
                                                <div key={project._id} className="project-card" onClick={() => navigate(`/projects/${project._id}`)}>
                                                    <div className="card-header card-bg-1">
                                                        <div className="icon-wraper" style={{ background: 'linear-gradient(135deg, #393989, #0c0f11)' }}>
                                                            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                                                                <defs>
                                                                    <linearGradient id={`grad-${project._id}`} x1="0" y1="0" x2="48" y2="48">
                                                                        <stop offset="0%" stopColor="#b1c9fe" />
                                                                        <stop offset="100%" stopColor="#b1c9fe" />
                                                                    </linearGradient>
                                                                </defs>
                                                                <rect x="8" y="24" width="6" height="14" rx="2" fill={`url(#grad-${project._id})`} />
                                                                <rect x="19" y="16" width="6" height="22" rx="2" fill={`url(#grad-${project._id})`} />
                                                                <rect x="30" y="10" width="6" height="28" rx="2" fill={`url(#grad-${project._id})`} />
                                                            </svg>
                                                        </div>
                                                       <button className="bookmark-btn" onClick={(e) => toggleBookmark(project._id, e)}>
                                                            <svg width="18" height="18" fill={bookmarkedIds.includes(project._id) ? "#fff" : "none"} stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="card-body">
                                                        <span className="project-card-title">{project.title}</span>
                                                        <span className="project-card-desc">{project.description}</span>
                                                        <div className="project-card-skills">
                                                            {project.required_skills?.slice(0, 3).map(skill => (
                                                                <div key={skill} className="skill-tag">{skill}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="card-footer">
                                                        <div className="star-container">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F59E0B" strokeWidth="2">
                                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                            </svg>
                                                            <span className="card-star-count">0</span>
                                                        </div>
                                                        <div className="member-container">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                <circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                            <span className="member-number">
                                                                {project.members?.length || 0}/{project.team_size || '?'}
                                                            </span>
                                                        </div>
                                                        <span className="match-badge">98% match</span>
                                                    </div>
                                                    <div className="join-container">
                                                        {isOwner ? (
                                                            <button className="join-btn your-project-btn">Your Project</button>
                                                        ) : isMember ? (
                                                            <button className="join-btn joined-btn">Joined ✓</button>
                                                        ) : (
                                                            <button className="join-btn" onClick={(e) => { e.stopPropagation(); handleJoinProject(project._id); }}>
                                                                Join Project
                                                            </button>
                                                        )}
                                                        <button className="bottom-bookmark-btn" onClick={(e) => toggleBookmark(project._id, e)}>
                                                            <svg width="18" height="18" fill={bookmarkedIds.includes(project._id) ? "#6366f1" : "none"} stroke="#1d1d1dd1" strokeWidth="1.3" viewBox="0 0 24 24">
                                                                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT */}
                    <div className="explore-right">

                        {/* Your Project Match */}
                        <div className="right-section">
                            <div className="match-header">
                                <span className="right-section-title">Your Project Match</span>
                                <a className="view-all-link">View details →</a>
                            </div>
                            <div className="match-stats">
                                <div className="match-stat">
                                    <span className="match-stat-number">{recommendedProjects.length}</span>
                                    <span className="match-stat-label">Recommended</span>
                                </div>
                                <div className="match-stat-divider" />
                                <div className="match-stat">
                                    <span className="match-stat-number match-percent">
                                        {recommendedProjects.length > 0
                                            ? Math.round(recommendedProjects.reduce((sum, p) => sum + p.match_score, 0) / recommendedProjects.length)
                                            : 0}%
                                    </span>
                                    <span className="match-stat-label">Avg Match Score</span>
                                </div>
                            </div>
                            <div className="top-technologies">
                                <span className="top-tech-title">Top Technologies</span>
                                {[
                                    { name: 'React', percent: 95 },
                                    { name: 'Node.js', percent: 88 },
                                    { name: 'Python', percent: 82 },
                                ].map(tech => (
                                    <div key={tech.name} className="tech-bar-item">
                                        <div className="tech-bar-label">
                                            <span>{tech.name}</span>
                                            <span>{tech.percent}%</span>
                                        </div>
                                        <div className="tech-bar-track">
                                            <div className="tech-bar-fill" style={{ width: `${tech.percent}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="new-matches">
                                <svg width="14" height="14" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24">
                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                </svg>
                                <span className="new-matches-text">+12 New Matches Today</span>
                            </div>
                        </div>

                        {/* Trending This Week */}
                        <div className="right-section">
                            <div className="match-header">
                                <span className="right-section-title">Trending This Week</span>
                                <a className="view-all-link">View all →</a>
                            </div>
                            <div className="trending-projects-content">
                                {[
                                    { rank: 1, title: 'AI Code Assistant', skills: 'Python, FastAPI, React', stars: 156, rankClass: 'trending-rank-1' },
                                    { rank: 2, title: 'Open Source Docs', skills: 'MDX, React, Tailwind', stars: 112, rankClass: 'trending-rank-2' },
                                    { rank: 3, title: 'DevPortfolio Starter', skills: 'Next.js, Tailwind, TypeScript', stars: 89, rankClass: 'trending-rank-3' },
                                    { rank: 4, title: 'GameHub', skills: 'C++, WebSocket, React', stars: 75, rankClass: 'trending-rank-3' },
                                    { rank: 5, title: 'EcoTrack', skills: 'Next.js, TypeScript, Tailwind', stars: 95, rankClass: 'trending-rank-2' },
                                ].map(item => (
                                    <div key={item.rank} className="trending-item">
                                        <div className={item.rankClass}>{item.rank}</div>
                                        <div className="trending-info">
                                            <span className="trending-title">{item.title}</span>
                                            <span className="trending-skills">{item.skills}</span>
                                        </div>
                                        <div className="trending-rating">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFD700" strokeWidth="2">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                            <span className="rating-count">{item.stars}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Contributors */}
                        <div className="right-section">
                            <div className="match-header">
                                <span className="right-section-title">Top Contributors</span>
                                <a className="view-all-link">View leaderboard →</a>
                            </div>
                            <div className="contributors-list">
                                {[
                                    { rank: 1, name: 'Kaivalya', pts: 245, you: true },
                                    { rank: 2, name: 'Alex Johnson', pts: 219, you: false },
                                    { rank: 3, name: 'Sarah Chen', pts: 198, you: false },
                                    { rank: 4, name: 'Michael Lee', pts: 176, you: false },
                                    { rank: 5, name: 'Priya Sharma', pts: 162, you: false },
                                ].map(c => (
                                    <div key={c.rank} className={`contributor-item ${c.you ? 'contributor-you' : ''}`}>
                                        <span className="contributor-rank">{c.rank}</span>
                                        <div className="contributor-avatar">
                                            {c.name.charAt(0)}
                                        </div>
                                        <span className="contributor-name">
                                            {c.name}
                                            {c.you && <span className="you-badge">You</span>}
                                        </span>
                                        <span className="contributor-pts">{c.pts} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="right-section">
                            <div className="match-header">
                                <span className="right-section-title">Recent Activity</span>
                                <a className="view-all-link">View all →</a>
                            </div>
                            <div className="right-activity-list">
                                {[
                                    { name: 'green_coder', action: 'commented on EcoTrack issue #142', time: '2 hours ago', color: '#10b981' },
                                    { name: 'ishu2022', action: 'pushed 3 commits to DevFlow', time: '4 hours ago', color: '#7c3aed' },
                                    { name: 'pixel_pirate', action: 'opened PR #56 in GameHub', time: '6 hours ago', color: '#f59e0b' },
                                ].map((item, i) => (
                                    <div key={i} className="right-activity-item">
                                        <div className="activity-avatar" style={{ background: item.color }}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="right-activity-info">
                                            <span className="right-activity-text">
                                                <strong>{item.name}</strong> {item.action}
                                            </span>
                                            <span className="right-activity-time">{item.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Explore;