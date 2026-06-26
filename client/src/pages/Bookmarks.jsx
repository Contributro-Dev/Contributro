import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { getAllProjects } from '../services/projectServices';
import { useState, useEffect, useContext } from 'react';
import './Bookmarks.css';

export default function Bookmarks() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    getAllProjects().then(res => {
      setBookmarks(res.data.filter(p => savedIds.includes(p._id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleBookmarkToggle(projectId) {
    setBookmarks(prev => prev.filter(p => p._id !== projectId));
  }

  return (
    <div className="bookmarks-layout">
      <Sidebar activePage="bookmarks" />
      <div className="bookmarks-container" style={{ marginLeft: '60px' }}>
        <nav className="bookmarks-nav">
          <div className="bookmarks-nav__left">
            <span className="bookmarks-nav__title">Bookmarked Projects</span>
            {bookmarks.length > 0 && (
              <span className="bookmarks-nav__count">{bookmarks.length} projects bookmarked</span>
            )}
          </div>
          <div className="bookmarks-nav__right">
            <span className="bookmarks-nav__user">{user?.username ?? 'Developer'}</span>
          </div>
        </nav>

        <main className="bookmarks-main">
          {loading ? (
            <div className="bookmarks-loading">
              {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : bookmarks.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="explore-grid">
              {bookmarks.map((project, i) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  cardIndex={i}
                  currentUser={user}
                  onBookmarkToggle={handleBookmarkToggle}
                  onClick={() => navigate(`/projects/${project._id}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProjectCard({ project, cardIndex, currentUser, onBookmarkToggle, onClick }) {
  const [bookmarked, setBookmarked] = useState(true);

  const skills = project.required_skills || project.skills || [];
  const memberCount = project.members?.length || 0;
  const teamSize = project.team_size || '?';
  const stars = project.stars || project.likes || 0;
  const matchScore = project.match_score || project.matchScore || null;

  const isOwner = currentUser && (
    String(project.owner_github_id) === String(currentUser.github_id) ||
    project.owner === currentUser._id
  );
  const isMember = currentUser && !isOwner && (
    project.members?.map(String).includes(String(currentUser.github_id)) ||
    project.members?.includes(currentUser._id)
  );

  const bgClass = `card-bg-${(cardIndex % 3) + 1}`;

  function handleBookmark(e) {
    e.stopPropagation();
    const existing = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    localStorage.setItem('bookmarks', JSON.stringify(existing.filter(id => id !== project._id)));
    setBookmarked(false);
    onBookmarkToggle(project._id);
  }

  if (!bookmarked) return null;

  return (
    <div
      className="project-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className={`card-header ${bgClass}`}>
        <div className="icon-wraper" style={{ background: '#fff' }}>
          <svg width="20" height="20" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
          </svg>
        </div>
        <button
          className="bookmark-top-btn"
          onClick={handleBookmark}
          aria-label="Remove bookmark"
          title="Remove bookmark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </div>

      <div className="card-body">
        <div className="project-card-status-row">
          <span className={`status-badge status-${project.status}`}>
            {project.status === 'open' ? 'Active' : project.status || 'Active'}
          </span>
        </div>
        <span className="project-card-title">{project.title}</span>
        <span className="project-card-desc">{project.description}</span>
        <div className="project-card-skills">
          {skills.slice(0, 3).map(skill => (
            <span className="skill-tag" key={skill}>{skill}</span>
          ))}
        </div>
      </div>

      <div className="card-footer">
        <div className="member-container">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span className="member-number">{memberCount} members</span>
        </div>
        <div className="star-container">
          <svg width="14" height="14" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="card-star-count">{stars}</span>
        </div>
        {matchScore && (
          <span className="bookmark-match">{matchScore}% match</span>
        )}
      </div>

      <div className="join-container">
        {isOwner ? (
          <button className="join-btn your-project-btn" onClick={e => e.stopPropagation()}>Your Project</button>
        ) : isMember ? (
          <button className="join-btn joined-btn" onClick={e => e.stopPropagation()}>Joined ✓</button>
        ) : (
          <button className="join-btn" onClick={e => e.stopPropagation()}>Join Project</button>
        )}
        <button className="bottom-bookmark-btn" onClick={handleBookmark} title="Remove bookmark">
          <svg width="14" height="14" fill="currentColor" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="project-card" style={{ pointerEvents: 'none' }}>
      <div className="card-header card-bg-1" style={{ opacity: 0.4 }} />
      <div className="card-body" style={{ gap: '10px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '14px', borderRadius: '6px', background: '#ede9fe', width: '40%' }} />
        <div style={{ height: '16px', borderRadius: '6px', background: '#ede9fe', width: '70%' }} />
        <div style={{ height: '13px', borderRadius: '6px', background: '#f3f0ff', width: '100%' }} />
        <div style={{ height: '13px', borderRadius: '6px', background: '#f3f0ff', width: '80%' }} />
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: '22px', width: '56px', borderRadius: '6px', background: '#ede9fe' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" />
        </svg>
      </div>
      <h2 className="empty-state__heading">No bookmarks yet</h2>
      <p className="empty-state__body">Save projects you're interested in and find them here anytime.</p>
      <button className="empty-state__cta" onClick={() => navigate('/explore')}>Explore projects</button>
    </div>
  );
}