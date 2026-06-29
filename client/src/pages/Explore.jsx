import { useEffect, useContext, useState, useRef, useCallback, useMemo } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useNavigate } from 'react-router-dom'
import { getRecommendedProjects } from "../services/recommendationServices.js";
import "./Explore.css";
import { getAllProjects, joinProject, toggleStar, getTrendingProjects, getRecentActivity } from "../services/projectServices.js";
import { getTopContributors } from "../services/userService.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { FiMoon, FiSun } from "react-icons/fi";


function Explore() {
    const cardsRef = useRef(null)
    const { user, token, logout } = useContext(AuthContext);
    const [allProjects, setAllProjects] = useState([]);
    const [recommendedProjects, setRecommendedProjects] = useState([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [trendingProjects, setTrendingProjects] = useState([]);
    const [topContributors, setTopContributors] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [sortBy, setSortBy] = useState('newest');
    const [skillFilters, setSkillFilters] = useState([]);
    const [difficultyFilters, setDifficultyFilters] = useState([]);
    const [availabilityFilters, setAvailabilityFilters] = useState([]);
    const [projectTypeFilters, setProjectTypeFilters] = useState([]);
    const [teamSizeFilters, setTeamSizeFilters] = useState([]);
    const [timelineFilters, setTimelineFilters] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [skillSearch, setSkillSearch] = useState('');
    const [showMoreSkills, setShowMoreSkills] = useState(false);
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [bookmarkedIds, setBookmarkedIds] = useState(() => JSON.parse(localStorage.getItem('bookmarks') || '[]'));
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const allSkills = [
        { name: 'React', count: 128 },
        { name: 'Next.js', count: 98 },
        { name: 'Node.js', count: 86 },
        { name: 'Python', count: 75 },
        { name: 'TypeScript', count: 68 },
        { name: 'Vue.js', count: 54 },
        { name: 'Django', count: 47 },
        { name: 'Flask', count: 41 },
        { name: 'MongoDB', count: 39 },
        { name: 'PostgreSQL', count: 35 },
    ];

    const filteredSkillList = allSkills.filter(s =>
        s.name.toLowerCase().includes(skillSearch.toLowerCase())
    );
    const visibleSkills = showMoreSkills ? filteredSkillList : filteredSkillList.slice(0, 5);

    const toggleFilter = (value, setter) =>
        setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

    const clearAll = () => {
        setSkillFilters([]);
        setDifficultyFilters([]);
        setAvailabilityFilters([]);
        setProjectTypeFilters([]);
        setTeamSizeFilters([]);
        setTimelineFilters([]);
        setSearchQuery('');
        setSkillSearch('');
        setSortBy('newest');
    };

    const getMatchPercent = useCallback((project) => {
        const userSkills = (user?.skills || []).map(s => s.toLowerCase());
        const projSkills = (project.required_skills || []).map(s => s.toLowerCase());
        if (!projSkills.length || !userSkills.length) return 0;
        const common = projSkills.filter(s => userSkills.includes(s));
        return Math.round((common.length / projSkills.length) * 100);
    }, [user]);

    const projects = useMemo(() => {
        let result = [...allProjects];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                (p.required_skills || []).some(s => s.toLowerCase().includes(q)) ||
                (p.tags || []).some(t => t.toLowerCase().includes(q))
            );
        }

        if (skillFilters.length > 0) {
            result = result.filter(p =>
                skillFilters.some(sf =>
                    (p.required_skills || []).map(s => s.toLowerCase()).includes(sf.toLowerCase())
                )
            );
        }

        if (difficultyFilters.length > 0) {
            result = result.filter(p => difficultyFilters.includes(p.difficulty));
        }

        if (availabilityFilters.length > 0) {
            result = result.filter(p => {
                return availabilityFilters.every(af => {
                    if (af === 'Open Positions') return p.status === 'open';
                    if (af === 'Remote Friendly') return p.remote_friendly === true;
                    if (af === 'Actively Maintained') return !!p.github_repo_url;
                    return true;
                });
            });
        }

        if (projectTypeFilters.length > 0) {
            result = result.filter(p => projectTypeFilters.includes(p.project_type));
        }

        if (teamSizeFilters.length > 0) {
            result = result.filter(p => {
                const size = p.team_size || 0;
                return teamSizeFilters.some(ts => {
                    if (ts === 'Solo (1)') return size <= 1;
                    if (ts === 'Small (2-5)') return size >= 2 && size <= 5;
                    if (ts === 'Medium (6-10)') return size >= 6 && size <= 10;
                    if (ts === 'Large (10+)') return size > 10;
                    return false;
                });
            });
        }

        if (timelineFilters.length > 0) {
            const tlMap = {
                'Short (< 1 month)': 'short',
                'Medium (1-3 months)': 'medium',
                'Long (3+ months)': 'long'
            };
            result = result.filter(p => timelineFilters.some(tl => p.timeline === tlMap[tl]));
        }

        result = [...result].sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'starred') return (b.stars || 0) - (a.stars || 0);
            if (sortBy === 'members') return (b.members?.length || 0) - (a.members?.length || 0);
            if (sortBy === 'match') return getMatchPercent(b) - getMatchPercent(a);
            if (sortBy === 'az') return (a.title || '').localeCompare(b.title || '');
            return 0;
        });

        return result;
    }, [allProjects, searchQuery, skillFilters, difficultyFilters, availabilityFilters, projectTypeFilters, teamSizeFilters, timelineFilters, sortBy, getMatchPercent]);

    const handleScroll = () => setScrolled(cardsRef.current.scrollLeft > 10);
    const scrollLeft = () => cardsRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    const scrollRight = () => cardsRef.current.scrollBy({ left: 280, behavior: 'smooth' });

    useEffect(() => {
        getAllProjects().then(r => setAllProjects(r.data)).catch(console.error);
    }, []);

    useEffect(() => {
        getTrendingProjects().then(r => setTrendingProjects(r.data)).catch(console.error);
    }, []);

    useEffect(() => {
        getTopContributors().then(r => setTopContributors(r.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (!token) return;
        getRecentActivity(token).then(r => setRecentActivity(r.data)).catch(console.error);
    }, [token]);

    useEffect(() => {
        if (!token) return;
        getRecommendedProjects(token).then(r => {
            setRecommendedProjects(r.data.recommendations || []);
        }).catch(console.error);
    }, [token]);

    const toggleBookmark = (projectId, e) => {
        e.stopPropagation();
        setBookmarkedIds(prev => {
            const updated = prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId];
            localStorage.setItem('bookmarks', JSON.stringify(updated));
            return updated;
        });
    };

    const handleJoinProject = (projectId) => {
        joinProject(projectId, token).then(response => {
            alert(response.data.message);
            const update = list => list.map(p => p._id === projectId ? { ...p, has_pending_request: true } : p);
            setAllProjects(prev => update(prev));
            setRecommendedProjects(prev => update(prev));
        }).catch(error => alert(error.response?.data?.message || 'Error'));
    };

    const handleToggleStar = (e, projectId) => {
        e.stopPropagation();
        toggleStar(projectId, token).then(response => {
            const update = list => list.map(p =>
                p._id === projectId ? { ...p, stars: response.data.star_count, is_starred: response.data.starred } : p
            );
            setAllProjects(prev => update(prev));
            setRecommendedProjects(prev => update(prev));
        }).catch(console.error);
    };

    const topTechnologies = useMemo(() => {
        if (!recommendedProjects.length || !user?.skills?.length) return [];
        const skillCount = {};
        recommendedProjects.forEach(p => {
            (p.required_skills || []).forEach(s => {
                const key = s.toLowerCase();
                skillCount[key] = (skillCount[key] || 0) + 1;
            });
        });
        return (user.skills || [])
            .map(s => s.toLowerCase())
            .filter(s => skillCount[s])
            .map(s => ({
                name: s.charAt(0).toUpperCase() + s.slice(1),
                percent: Math.round((skillCount[s] / recommendedProjects.length) * 100)
            }))
            .sort((a, b) => b.percent - a.percent)
            .slice(0, 3);
    }, [recommendedProjects, user]);

    const avgMatchScore = recommendedProjects.length > 0
        ? Math.round(recommendedProjects.reduce((sum, p) => sum + (p.match_score || 0), 0) / recommendedProjects.length)
        : 0;

    const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

    const ProjectCard = ({ project, size = 'normal' }) => {
        const isOwner = project.owner_github_id === String(user?.github_id);
        const isMember = project.members?.includes(String(user?.github_id));
        return (
            <div className="project-card" onClick={() => navigate(`/projects/${project._id}`)}>
                <div className="card-header card-bg-1">
                    <div className="icon-wraper" style={{ background: 'linear-gradient(135deg, #393989, #0c0f11)' }}>
                        <svg width={size === 'normal' ? 24 : 32} height={size === 'normal' ? 24 : 32} viewBox="0 0 48 48" fill="none">
                            <rect x="8" y="24" width="6" height="14" rx="2" fill="#b1c9fe" />
                            <rect x="19" y="16" width="6" height="22" rx="2" fill="#b1c9fe" />
                            <rect x="30" y="10" width="6" height="28" rx="2" fill="#b1c9fe" />
                        </svg>
                    </div>
                    <button className="bookmark-btn" onClick={e => toggleBookmark(project._id, e)}>
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
                    <div className="star-container" onClick={e => handleToggleStar(e, project._id)} style={{ cursor: "pointer" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"
                            fill={project.is_starred ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="card-star-count">{project.stars || 0}</span>
                    </div>
                    <div className="member-container">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="member-number">{project.members?.length || 0}/{project.team_size || '?'}</span>
                    </div>
                    <span className="match-badge">{getMatchPercent(project)}% match</span>
                </div>
                <div className="join-container">
                    {isOwner ? (
                        <button className="join-btn your-project-btn">Your Project</button>
                    ) : isMember ? (
                        <button className="join-btn joined-btn">Joined ✓</button>
                    ) : project.has_pending_request ? (
                        <button className="join-btn pending-btn" disabled>Request Pending</button>
                    ) : (
                        <button className="join-btn" onClick={e => { e.stopPropagation(); handleJoinProject(project._id); }}>
                            Join Project
                        </button>
                    )}
                    <button className="bottom-bookmark-btn" onClick={e => toggleBookmark(project._id, e)}>
                        <svg width="18" height="18" fill={bookmarkedIds.includes(project._id) ? "#6366f1" : "none"} stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
            <Sidebar activePage="explore" />
            <div className="explore-container">
                <div className="explore-nav">
                    <div className="search-bar">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                            type="text"
                            placeholder="Search projects, skills, technologies..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="nav-right">
                        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
                            {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
                        </button>
                        <button className="notifications">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </button>
                        <div className="profile-section" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="profile-pic">{user?.avatar
                                ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                : firstLetter}</div>
                            <span>{user?.name || user?.username || "User"}</span>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
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

                <div className="explore-content">
                    <div className="explore-center">
                        <div className="explore-header">
                            <div className="header-left">
                                <span className="explore-title">Explore Projects</span>
                                <span className="explore-msg">Find meaningful projects and contribution to open source.</span>
                            </div>
                            <div className="header-right">
                                <div className='create-div' onClick={() => navigate('/create-project')}>
                                    <span className="create-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </span>
                                    <span className="create-label">Create New Project</span>
                                </div>
                            </div>
                        </div>

                        <div className="explore-tabs">
                            <div className="tab">All</div>
                            <div className="tab">AI Recommended</div>
                            <div className="tab">Trending</div>
                            <div className="tab">Newest</div>
                            <div className="tab">Hackathons</div>
                            <div className="tab">Remote</div>
                            <div className="tab">Open Source</div>
                            <div className="tab">Beginner Friendly</div>
                            <div className="tab">More <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg></div>
                        </div>

                        <div className="explore-bottom">
                            <div className="explore-filters">
                                <div className="filter-header">
                                    <span>Filters</span>
                                    <a className="filter-clear-btn" onClick={clearAll} style={{ cursor: 'pointer' }}>Clear All</a>
                                </div>

                                <div className="filter-section">
                                    <span className="filter-section-title">Skills</span>
                                    <div className="filter-search">
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                        <input
                                            type="text"
                                            placeholder="Search skills..."
                                            value={skillSearch}
                                            onChange={e => setSkillSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="filter-list">
                                        {visibleSkills.map(skill => (
                                            <label key={skill.name} className="filter-item">
                                                <div className="filter-item-left">
                                                    <input
                                                        type="checkbox"
                                                        checked={skillFilters.includes(skill.name)}
                                                        onChange={() => toggleFilter(skill.name, setSkillFilters)}
                                                    />
                                                    <span>{skill.name}</span>
                                                </div>
                                                <span className="filter-count">{skill.count}</span>
                                            </label>
                                        ))}
                                        {filteredSkillList.length === 0 && (
                                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>No skills found.</span>
                                        )}
                                    </div>
                                    {filteredSkillList.length > 5 && (
                                        <span className="filter-show-more" style={{ cursor: 'pointer' }} onClick={() => setShowMoreSkills(!showMoreSkills)}>
                                            {showMoreSkills ? 'Show less' : `Show more (${filteredSkillList.length - 5} more)`}
                                        </span>
                                    )}
                                </div>

                                <div className="filter-section">
                                    <span className="filter-section-title">Difficulty</span>
                                    <div className="filter-list">
                                        {[{ name: 'Beginner', count: 56 }, { name: 'Intermediate', count: 89 }, { name: 'Advanced', count: 28 }].map(item => (
                                            <label key={item.name} className="filter-item">
                                                <div className="filter-item-left">
                                                    <input type="checkbox" checked={difficultyFilters.includes(item.name)} onChange={() => toggleFilter(item.name, setDifficultyFilters)} />
                                                    <span>{item.name}</span>
                                                </div>
                                                <span className="filter-count">{item.count}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="filter-section">
                                    <span className="filter-section-title">Availability</span>
                                    <div className="filter-list">
                                        {[{ name: 'Open Positions', count: 112 }, { name: 'Remote Friendly', count: 97 }, { name: 'Actively Maintained', count: 137 }].map(item => (
                                            <label key={item.name} className="filter-item">
                                                <div className="filter-item-left">
                                                    <input type="checkbox" checked={availabilityFilters.includes(item.name)} onChange={() => toggleFilter(item.name, setAvailabilityFilters)} />
                                                    <span>{item.name}</span>
                                                </div>
                                                <span className="filter-count">{item.count}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="filter-section">
                                    <span className="filter-section-title filter-more-toggle" onClick={() => setShowMoreFilters(!showMoreFilters)} style={{ cursor: 'pointer' }}>
                                        More Filters
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                                            style={{ transform: showMoreFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </span>
                                    {showMoreFilters && (
                                        <div className="more-filters-container">
                                            <div className="more-filter-group">
                                                <span className="more-filter-label">Project Type</span>
                                                <div className="filter-list">
                                                    {['Open Source', 'Hackathon', 'Startup', 'Research'].map(item => (
                                                        <label key={item} className="filter-item">
                                                            <div className="filter-item-left">
                                                                <input type="checkbox" checked={projectTypeFilters.includes(item)} onChange={() => toggleFilter(item, setProjectTypeFilters)} />
                                                                <span>{item}</span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="more-filter-group">
                                                <span className="more-filter-label">Team Size</span>
                                                <div className="filter-list">
                                                    {['Solo (1)', 'Small (2-5)', 'Medium (6-10)', 'Large (10+)'].map(item => (
                                                        <label key={item} className="filter-item">
                                                            <div className="filter-item-left">
                                                                <input type="checkbox" checked={teamSizeFilters.includes(item)} onChange={() => toggleFilter(item, setTeamSizeFilters)} />
                                                                <span>{item}</span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="more-filter-group">
                                                <span className="more-filter-label">Timeline</span>
                                                <div className="filter-list">
                                                    {['Short (< 1 month)', 'Medium (1-3 months)', 'Long (3+ months)'].map(item => (
                                                        <label key={item} className="filter-item">
                                                            <div className="filter-item-left">
                                                                <input type="checkbox" checked={timelineFilters.includes(item)} onChange={() => toggleFilter(item, setTimelineFilters)} />
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
                                <div className="recomended-projects-section">
                                    <span className="recomendation-header">
                                        AI Recommended For You
                                        <a href="#" className="view-all-link" onClick={e => { e.preventDefault(); navigate('/recommendations'); }}>View all recomendations {"->"}</a>
                                    </span>
                                    <span className="recomendation-subheader">projects that match your skills and interests</span>
                                    <div className="cards-carousel-wrapper">
                                        {scrolled && (
                                            <button className="carousel-btn carousel-btn-left" onClick={scrollLeft}>
                                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                                            </button>
                                        )}
                                        {scrolled && <div className="cards-fade-left" />}
                                        <div className="reconmended-projects-cards" ref={cardsRef} onScroll={handleScroll}>
                                            {recommendedProjects.length === 0 ? (
                                                <p style={{ padding: '12px', color: '#9ca3af' }}>No recommendations yet — add some skills to your profile.</p>
                                            ) : (
                                                recommendedProjects.map(project => (
                                                    <ProjectCard key={project._id} project={project} size="large" />
                                                ))
                                            )}
                                        </div>
                                        <button className="carousel-btn carousel-btn-right" onClick={scrollRight}>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                                        </button>
                                        <div className="cards-fade-right" />
                                    </div>
                                </div>

                                <div className="all-projects-section">
                                    <div className="all-projects-header">
                                        <div className="all-projects-title-group">
                                            <span className="all-projects-title">All Projects</span>
                                            <span className="all-projects-count">{projects.length} projects found</span>
                                        </div>
                                        <div className="all-projects-controls">
                                            <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                                <option value="newest">Sort by: Newest</option>
                                                <option value="oldest">Sort by: Oldest</option>
                                                <option value="match">Sort by: Highest Match</option>
                                                <option value="starred">Sort by: Most Starred</option>
                                                <option value="members">Sort by: Most Members</option>
                                                <option value="az">Sort by: A-Z</option>
                                            </select>
                                            <div className="view-toggle">
                                                <button className="view-btn view-btn-active">
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                                </button>
                                                <button className="view-btn">
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="all-projects-grid">
                                        {projects.length === 0 ? (
                                            <p style={{ color: '#9ca3af', padding: '24px 0', gridColumn: '1/-1' }}>No projects found matching your filters.</p>
                                        ) : (
                                            projects.map(project => <ProjectCard key={project._id} project={project} />)
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="explore-right">
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
                                    <span className="match-stat-number match-percent">{avgMatchScore}%</span>
                                    <span className="match-stat-label">Avg Match Score</span>
                                </div>
                            </div>
                            <div className="top-technologies">
                                <span className="top-tech-title">Top Technologies</span>
                                {topTechnologies.length === 0 ? (
                                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>Add skills to see top technologies.</p>
                                ) : topTechnologies.map(tech => (
                                    <div key={tech.name} className="tech-bar-item">
                                        <div className="tech-bar-label"><span>{tech.name}</span><span>{tech.percent}%</span></div>
                                        <div className="tech-bar-track"><div className="tech-bar-fill" style={{ width: `${tech.percent}%` }} /></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="right-section">
                            <div className="match-header">
                                <span className="right-section-title">Trending This Week</span>
                                <a className="view-all-link">View all →</a>
                            </div>
                            <div className="trending-projects-content">
                                {trendingProjects.length === 0 ? (
                                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>No trending projects yet.</p>
                                ) : trendingProjects.map((item, i) => (
                                    <div key={item._id} className="trending-item">
                                        <div className={`trending-rank-${Math.min(i + 1, 3)}`}>{i + 1}</div>
                                        <div className="trending-info">
                                            <span className="trending-title">{item.title}</span>
                                            <span className="trending-skills">{item.required_skills?.slice(0, 3).join(', ')}</span>
                                        </div>
                                        <div className="trending-rating">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFD700" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            <span className="rating-count">{item.stars || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="right-section">
                            <div className="match-header">
                                <span className="right-section-title">Top Contributors</span>
                                <a className="view-all-link">View leaderboard →</a>
                            </div>
                            <div className="contributors-list">
                                {topContributors.length === 0 ? (
                                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>No contributors yet.</p>
                                ) : topContributors.map((c, i) => (
                                    <div key={c.github_id} className={`contributor-item ${c.github_id === String(user?.github_id) ? 'contributor-you' : ''}`}>
                                        <span className="contributor-rank">{i + 1}</span>
                                        <div className="contributor-avatar">
                                            {c.avatar_url
                                                ? <img src={c.avatar_url} alt={c.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                : c.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="contributor-name">
                                            {c.username}
                                            {c.github_id === String(user?.github_id) && <span className="you-badge">You</span>}
                                        </span>
                                        <span className="contributor-pts">{c.score} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="right-section">
                            <div className="match-header">
                                <span className="right-section-title">Recent Activity</span>
                                <a className="view-all-link" >View all →</a>
                            </div>
                            <div className="right-activity-list">
                                {recentActivity.length === 0 ? (
                                    <p style={{ color: '#9ca3af', fontSize: '13px', padding: '8px 0' }}>No recent activity yet.</p>
                                ) : recentActivity.map((item, i) => (
                                    <div key={i} className="right-activity-item">
                                        <div className="activity-avatar" style={{ background: '#6366f1' }}>
                                            {(item.username && item.username !== 'Unknown' ? item.username : 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="right-activity-info">
                                            <span className="right-activity-text">
                                                <strong>{item.username && item.username !== 'Unknown' ? item.username : 'User'}</strong> {item.action}
                                                {item.project_title ? ` — ${item.project_title}` : ''}
                                            </span>
                                            <span className="right-activity-time">
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Explore;