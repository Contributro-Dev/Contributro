import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getAllProjects, joinProject } from "../services/projectServices.js";
import Sidebar from "../components/Sidebar.jsx";
import "./Explore.css";

function Explore() {

    const { login, user, token, logout } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false)


    const [showMoreFilters, setShowMoreFilters] = useState(false)

    // ─────────────────────────────────────────────
    // Load projects
    // ─────────────────────────────────────────────
    useEffect(() => {
        getAllProjects().then((response) => {
            setProjects(response.data);
        });
    }, []);

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

                {/* content */}
                <div className="explore-content">

                    {/* CENTER */}
                    <div className="explore-center">

                        {/* Header + stats */}
                        <div className="explore-header">
                            <span className="explore-title">Explore Projects</span>
                            <span className="explore-msg">Find meaningful projects and contribution to open source.</span>
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

                            </div>
                        </div>

                    </div>

                    {/* RIGHT */}
                    <div className="explore-right"></div>

                </div>
            </div>
        </div>
    )
}

export default Explore;