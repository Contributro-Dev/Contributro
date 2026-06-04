import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { FiLogOut, FiPlus, FiGrid, FiCompass, FiStar } from "react-icons/fi";
import { RiRocketLine } from "react-icons/ri";

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [hoveredNav, setHoveredNav] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { label: "Dashboard", path: "/dashboard", icon: FiGrid },
        { label: "Browse", path: "/browse", icon: FiCompass },
        { label: "Recommendations", path: "/recommendations", icon: FiStar },
    ];

    const avatarLetter = (user?.name || user?.username || user?.login || "U")[0].toUpperCase();

    return (
        <nav
            style={{
                height: '60px',
                borderBottom: '1px solid rgba(99,102,241,0.15)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2rem',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'rgba(10,10,16,0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 1px 0 rgba(99,102,241,0.1), 0 4px 24px rgba(0,0,0,0.4)',
            }}
        >
            {/* Top glow line */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(99,102,241,0.5), transparent)',
                pointerEvents: 'none',
            }} />

            {/* LEFT */}
            <div className="flex items-center gap-6">
                {/* Logo */}
                <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/dashboard')}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
                        <RiRocketLine className="text-white text-sm" />
                    </div>
                    <span className="font-bold text-base tracking-tight" style={{
                        background: 'linear-gradient(135deg, #e4e4f0, #a5b4fc)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Contributro
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

                {/* Nav links */}
                {user && (
                    <div className="flex items-center gap-1">
                        {navLinks.map(({ label, path, icon: Icon }) => {
                            const isActive = location.pathname === path;
                            return (
                                <button
                                    key={path}
                                    onClick={() => navigate(path)}
                                    onMouseEnter={() => setHoveredNav(path)}
                                    onMouseLeave={() => setHoveredNav(null)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                                    style={{
                                        color: isActive ? '#a5b4fc' : hoveredNav === path ? '#c7d2fe' : '#6b7280',
                                        background: isActive ? 'rgba(99,102,241,0.12)' : hoveredNav === path ? 'rgba(255,255,255,0.05)' : 'transparent',
                                        border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                                    }}
                                >
                                    <Icon className="text-xs" style={{ color: isActive ? '#818cf8' : 'inherit' }} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT */}
            {user && (
                <div className="flex items-center gap-2">
                    {/* Post Project */}
                    <button
                        onClick={() => navigate('/create-project')}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff',
                            border: '1px solid rgba(139,92,246,0.4)',
                            boxShadow: '0 0 16px rgba(99,102,241,0.25)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 24px rgba(99,102,241,0.45)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 16px rgba(99,102,241,0.25)'}
                    >
                        <FiPlus className="text-sm" />
                        Post Project
                    </button>

                    {/* Avatar */}
                    <div
                        className="relative w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer select-none transition-all duration-200 hover:scale-110"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
                            border: '2px solid rgba(99,102,241,0.4)',
                            boxShadow: '0 0 12px rgba(99,102,241,0.3)',
                        }}
                        title={user?.username || user?.name}
                    >
                        {avatarLetter}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400"
                            style={{ border: '2px solid rgba(10,10,16,0.92)' }} />
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                        style={{ color: '#6b7280', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.04)' }}
                        title="Logout"
                        onMouseEnter={e => {
                            e.currentTarget.style.color = '#f87171';
                            e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)';
                            e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.08)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = '#6b7280';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                        }}
                    >
                        <FiLogOut className="text-sm" />
                    </button>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
