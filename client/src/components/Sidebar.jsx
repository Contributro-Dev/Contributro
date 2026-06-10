

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const navLinks = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },

    { id: 'explore', label: 'Explore Projects', path: '/explore', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },

    { id: 'my-projects', label: 'My Projects', path: '/projects', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg> },

    { id: 'requests', label: 'Requests', path: '/requests', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> },

    { id: 'bookmarks', label: 'Bookmarks', path: '/bookmarks', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg> },

    { id: 'messages', label: 'Messages', path: '/messages', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg> },

    { id: 'profile', label: 'Profile', path: '/profile', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },

    { id: 'settings', label: 'Settings', path: '/settings', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg> },
];

function Sidebar({ activePage }) {
    const { user, logout } = useContext(AuthContext);

    const navigate = useNavigate();

    const [isExpanded, setIsExpanded] = useState(false); //  collapsed 



    return (
        <div className={`sidebar ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`} onMouseEnter={() => {
            console.log('mouse entered')
            setIsExpanded(true)
        }} onMouseLeave={() => setIsExpanded(false)}>
            <div className="sidebar-logo">
                <span className="sidebar-logo-icon">
                    <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M22 18L10 32L22 46"
                            stroke="#4F46E5"
                            stroke-width="5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />

                        <path
                            d="M42 18L54 32L42 46"
                            stroke="#4F46E5"
                            stroke-width="5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />

                        <path
                            d="M36 14L28 50"
                            stroke="#2563EB"
                            stroke-width="5"
                            stroke-linecap="round"
                        />
                    </svg>
                </span>
                {isExpanded && <span className="sidebar-logo-text">Contributro</span>}
            </div>
            <div className="sidebar-nav">
                {navLinks.map(link => (
                    <div
                        key={link.id}
                        className={`sidebar-link ${activePage === link.id ? 'sidebar-link-active' : ''}`}
                        onClick={() => navigate(link.path)}
                    >
                        <span className="sidebar-icon">{link.icon}</span>
                        {isExpanded && <span className="sidebar-label">{link.label}</span>}
                    </div>
                ))}
                <div className="create-new">
                    <div className='create-div' onClick={() => navigate('/create-project')}>
                        <span className="create-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M12 5V19M5 12H19"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </span>
                        {isExpanded && <span className="create-label">Create New Project</span>}
                    </div>
                </div>
            </div>
            <div className="sidebar-bottom">
                <div className="sidebar-link" onClick={logout}>
                    <span className="sidebar-icon">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </span>
                    {isExpanded && <span className="sidebar-label">Logout</span>}
                </div>
            </div>

        </div>
    )

}

export default Sidebar;

