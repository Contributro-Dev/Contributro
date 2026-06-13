import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import './Bookmarks.css';
import { getAllProjects } from '../services/projectServices';
import { useState, useEffect, useContext } from 'react';

const STATUS_CLASSES = {
  Active: 'badge badge--active',
  'Seeking Contributors': 'badge badge--seeking',
  'In Review': 'badge badge--review',
};

export default function Bookmarks() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    getAllProjects().then(res => {
      setBookmarks(res.data.filter(p => savedIds.includes(p._id)));
    });
  }, []);

  return (
    <div className="bookmarks-layout">
      <Sidebar activePage="bookmarks" />

      <div className="bookmarks-container" style={{ marginLeft: '60px' }}>
        <nav className="bookmarks-nav">
          <div className="bookmarks-nav__left">
            <span className="bookmarks-nav__title">Bookmarks</span>
            {bookmarks.length > 0 && (
              <span className="bookmarks-nav__count">{bookmarks.length}</span>
            )}
          </div>
          <div className="bookmarks-nav__right">
            <span className="bookmarks-nav__user">{user?.username ?? 'Developer'}</span>
          </div>
        </nav>

        <main className="bookmarks-main">
          {bookmarks.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <p className="bookmarks-subtitle">
                Projects you've saved — pick up where you left off.
              </p>
              <div className="bookmarks-grid">
                {bookmarks.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onClick={() => navigate(`/projects/${project._id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }) {
  const [saved, setSaved] = useState(true);

  function handleUnsave(e) {
    e.stopPropagation();
    const existing = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    localStorage.setItem('bookmarks', JSON.stringify(existing.filter(id => id !== project._id)));
    setSaved(false);
  }

  if (!saved) return null;

  const skills = project.required_skills || project.skills || [];
  const memberCount = project.members?.length || 0;
  const teamSize = project.team_size || '?';

  return (
    <div
      className="project-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="project-card__header">
        <span className={STATUS_CLASSES[project.status] ?? 'badge badge--default'}>
          {project.status || 'Active'}
        </span>
        <button
          className="project-card__unsave"
          onClick={handleUnsave}
          title="Remove bookmark"
          aria-label="Remove bookmark"
        >
          <BookmarkFilledIcon />
        </button>
      </div>

      <h3 className="project-card__title">{project.title}</h3>
      <p className="project-card__desc">{project.description}</p>

      <div className="project-card__skills">
        {skills.slice(0, 4).map((skill) => (
          <span key={skill} className="skill-tag">{skill}</span>
        ))}
      </div>

      <div className="project-card__footer">
        <span className="project-card__match">
          <span className="match-dot" />
          98% match
        </span>
        <span className="project-card__contributors">
          <ContributorsIcon />
          {memberCount}/{teamSize}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <BookmarkOutlineIcon />
      </div>
      <h2 className="empty-state__heading">No bookmarks yet</h2>
      <p className="empty-state__body">
        Save projects you're interested in and find them here anytime.
      </p>
      <button className="empty-state__cta" onClick={() => navigate('/explore')}>
        Explore projects
      </button>
    </div>
  );
}

function BookmarkFilledIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function BookmarkOutlineIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function ContributorsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}