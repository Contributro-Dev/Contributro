

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

function Sidebar({ activePage}) {
    const { user, logout } = useContext(AuthContext);

    const navigate = useNavigate();

    const [isExpanded, setIsExpanded] = useState(activePage === 'dashboard'); // Start expanded on dashboard, collapsed on other pages




    return (
        <div className={`sidebar ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`} onMouseEnter={() => {
            console.log('mouse entered')
            setIsExpanded(true)
        }} onMouseLeave={() => setIsExpanded(false)}>
            <div className="sidebar-logo">
                <span className="sidebar-logo-icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 200 200"
                        width="28px"
                        height="28px"
                    >
                        <defs>
                            <linearGradient id="primaryPart" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#1D4ED8" />
                            </linearGradient>
                            <linearGradient id="accentPart" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#06B6D4" />
                                <stop offset="100%" stopColor="#0891B2" />
                            </linearGradient>
                            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow
                                    dx={0}
                                    dy={8}
                                    stdDeviation={10}
                                    floodColor="#1E3A8A"
                                    floodOpacity={0.25}
                                />
                            </filter>
                        </defs>
                        <g filter="url(#neonGlow)">
                            <path
                                d="M 40,40               L 115,40               L 115,75               L 75,75               L 75,125               L 160,125               L 160,160               L 40,160               Z"
                                fill="url(#primaryPart)"
                            />
                            <path
                                d="M 160,40               L 160,95               L 125,95               L 125,75               L 115,75               L 115,40               Z"
                                fill="url(#accentPart)"
                            />
                            <rect x={125} y={40} width={20} height={20} fill="#22D3EE" rx={2} />
                        </g>
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

