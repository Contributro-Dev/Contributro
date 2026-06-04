import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { updateSkills } from '../services/userService.js';
import {
    FiSearch, FiX, FiCheck, FiZap, FiUsers, FiFolder, FiStar,
    FiCode, FiLayers, FiCpu, FiDatabase, FiGlobe, FiGitBranch
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { RiRocketLine } from 'react-icons/ri';

const allSkills = [
    "Python", "JavaScript", "React", "Node.js", "Flask", "Django",
    "MongoDB", "PostgreSQL", "MySQL", "TypeScript", "Java", "C++",
    "Artificial Intelligence", "Machine Learning", "Deep Learning",
    "Data Science", "Computer Vision", "NLP", "Docker", "Kubernetes",
    "AWS", "Firebase", "GraphQL", "REST APIs", "Git", "Linux",
    "Figma", "UI/UX", "Tailwind CSS", "Bootstrap", "Next.js", "Gatsby",
    "Redux", "Vue.js", "Angular", "Express.js", "Scikit-learn",
    "Pandas", "NumPy", "TensorFlow", "PyTorch", "OpenCV"
];

const popularSkills = ["React", "Python", "JavaScript", "TypeScript", "Node.js", "Machine Learning", "Docker", "AWS"];

const allInterests = [
    { label: "Web Development", icon: FiGlobe, color: "from-blue-500 to-cyan-400" },
    { label: "Mobile Development", icon: FiLayers, color: "from-purple-500 to-pink-400" },
    { label: "AI/ML", icon: FiCpu, color: "from-amber-500 to-orange-400" },
    { label: "Data Science", icon: FiDatabase, color: "from-emerald-500 to-teal-400" },
    { label: "DevOps", icon: FiGitBranch, color: "from-slate-500 to-gray-400" },
    { label: "Cybersecurity", icon: FiZap, color: "from-red-500 to-rose-400" },
    { label: "Game Development", icon: FiStar, color: "from-violet-500 to-purple-400" },
    { label: "Blockchain", icon: FiCode, color: "from-yellow-500 to-amber-400" },
    { label: "Open Source", icon: FiGitBranch, color: "from-green-500 to-emerald-400" },
    { label: "EdTech", icon: FiLayers, color: "from-sky-500 to-blue-400" },
    { label: "FinTech", icon: FiDatabase, color: "from-lime-500 to-green-400" },
    { label: "HealthTech", icon: FiStar, color: "from-pink-500 to-rose-400" },
    { label: "SaaS", icon: FiGlobe, color: "from-indigo-500 to-blue-400" },
    { label: "E-Commerce", icon: FiZap, color: "from-orange-500 to-amber-400" },
    { label: "Social Impact", icon: FiUsers, color: "from-teal-500 to-cyan-400" },
];

const intentOptions = [
    {
        value: "project",
        label: "Looking for Projects",
        desc: "I want to find exciting open-source or startup projects to contribute to.",
        icon: FiFolder,
        gradient: "from-blue-600 to-cyan-500"
    },
    {
        value: "collaborator",
        label: "Looking for Collaborators",
        desc: "I have ideas and need talented teammates to build with.",
        icon: FiUsers,
        gradient: "from-purple-600 to-pink-500"
    },
    {
        value: "both",
        label: "Both",
        desc: "I'm open to everything — projects, collaborations, and opportunities.",
        icon: RiRocketLine,
        gradient: "from-amber-500 to-orange-500"
    }
];

const aiRecommendations = {
    "React": { tag: "Frontend Projects", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    "Python": { tag: "AI Projects", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
    "Machine Learning": { tag: "ML Teams", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    "Node.js": { tag: "Backend Projects", color: "bg-green-500/20 text-green-300 border-green-500/30" },
    "TypeScript": { tag: "Enterprise Apps", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
    "Docker": { tag: "DevOps Teams", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
    "AWS": { tag: "Cloud Projects", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
    "Django": { tag: "Web Projects", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    "TensorFlow": { tag: "AI/ML Teams", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    "GraphQL": { tag: "API Projects", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
    "Next.js": { tag: "Full-Stack Apps", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
    "PostgreSQL": { tag: "Data Projects", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
};

function toggleItem(list, item) {
    return list.includes(item) ? list.filter(i => i !== item) : [...list, item];
}

function SkillsPopUp({ onClose }) {
    const { user, token, updateUser } = useContext(AuthContext);
    const [selectedSkills, setSelectedSkills] = useState(user.skills || []);
    const [selectedInterests, setSelectedInterests] = useState(user.interests || []);
    const [intent, setIntent] = useState(user.intent || "both");
    const [skillSearch, setSkillSearch] = useState("");
    const [activeTab, setActiveTab] = useState("skills");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        setTimeout(() => setMounted(true), 10);
    }, []);

    const filteredSkills = allSkills.filter(s =>
        s.toLowerCase().includes(skillSearch.toLowerCase())
    );

    const completion = Math.min(
        100,
        Math.round(
            (Math.min(selectedSkills.length, 5) / 5) * 40 +
            (Math.min(selectedInterests.length, 3) / 3) * 30 +
            (intent ? 30 : 0)
        )
    );

    const recommendations = selectedSkills
        .filter(s => aiRecommendations[s])
        .slice(0, 4)
        .map(s => ({ skill: s, ...aiRecommendations[s] }));

    function handleSubmit() {
        setSaving(true);
        updateSkills(token, user.github_id, {
            skills: selectedSkills,
            interests: selectedInterests,
            intent: intent
        })
            .then(() => {
                updateUser({ skills: selectedSkills, interests: selectedInterests, intent });
                setSaving(false);
                setSaved(true);
                setTimeout(() => onClose(), 1200);
            })
            .catch(err => {
                console.error("Failed to update profile", err);
                setSaving(false);
            });
    }

    const avatarLetter = (user?.name || user?.login || "U")[0].toUpperCase();

    const tabs = [
        { id: "skills", label: "⚡ Skills", count: selectedSkills.length },
        { id: "interests", label: "🎯 Interests", count: selectedInterests.length },
        { id: "intent", label: "🚀 Intent", count: null },
        ];

    return (
        <div
            className={`fixed left-0 right-0 bottom-0 flex items-center justify-center p-4 transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', top: '60px', zIndex: 101 }}
        >
            {/* Modal */}
            <div
                className={`relative w-full max-w-lg flex flex-col transition-all duration-500 ${mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
                style={{
                    maxHeight: '92vh',
                    background: 'linear-gradient(145deg, rgba(18,18,28,0.98) 0%, rgba(12,12,20,0.99) 100%)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '20px',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(99,102,241,0.08)',
                }}
            >
                {/* Top glow line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(99,102,241,0.6), transparent)' }} />

                {/* HEADER */}
                <div className="px-6 pt-6 pb-0 flex-shrink-0">
                    {/* Top row: avatar + close */}
                    <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
                                    {avatarLetter}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2"
                                    style={{ borderColor: '#0c0c14' }} />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h2 className="text-white font-bold text-base leading-tight">Welcome to Contributro</h2>
                                    <RiRocketLine className="text-indigo-400 text-base" />
                                </div>
                                <p className="text-xs mt-0.5" style={{ color: '#6b6b8a' }}>
                                    Complete your profile for better recommendations
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all flex-shrink-0"
                        >
                            <FiX className="text-base" />
                        </button>
                    </div>

                    {/* Completion bar */}
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium" style={{ color: '#8b8baa' }}>Profile completion</span>
                            <span className="text-xs font-bold" style={{
                                color: completion >= 70 ? '#34d399' : completion >= 40 ? '#f59e0b' : '#6366f1'
                            }}>{completion}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${completion}%`,
                                    background: completion >= 70
                                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                                        : completion >= 40
                                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                            : 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 rounded-xl mb-0" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${activeTab === tab.id
                                    ? 'text-white shadow-lg'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                style={activeTab === tab.id ? {
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
                                    border: '1px solid rgba(99,102,241,0.3)',
                                } : {}}
                            >
                                {tab.label}
                                {tab.count !== null && tab.count > 0 && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                                        style={{ background: 'rgba(99,102,241,0.4)', color: '#a5b4fc' }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px mx-6 mt-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

                {/* BODY */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.3) transparent' }}>

                    {/* ── SKILLS TAB ── */}
                    {activeTab === "skills" && (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Search for a skill..."
                                    value={skillSearch}
                                    onChange={e => setSkillSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl text-white placeholder-gray-600 outline-none transition-all"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                {skillSearch && (
                                    <button onClick={() => setSkillSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                                        <FiX className="text-sm" />
                                    </button>
                                )}
                            </div>

                            {/* Selected Skills */}
                            {selectedSkills.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold mb-2" style={{ color: '#6b6b8a' }}>SELECTED</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSkills.map(skill => (
                                            <span key={skill}
                                                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-lg text-xs font-medium text-white transition-all cursor-pointer hover:opacity-80 group"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
                                                    border: '1px solid rgba(99,102,241,0.4)',
                                                }}
                                                onClick={() => setSelectedSkills(toggleItem(selectedSkills, skill))}
                                            >
                                                {skill}
                                                <FiX className="text-xs opacity-60 group-hover:opacity-100 transition-opacity" />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Popular or Filtered */}
                            <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: '#6b6b8a' }}>
                                    {skillSearch ? 'RESULTS' : 'POPULAR SKILLS'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {(skillSearch ? filteredSkills : popularSkills).map(skill => {
                                        const isSelected = selectedSkills.includes(skill);
                                        return (
                                            <button
                                                key={skill}
                                                onClick={() => setSelectedSkills(toggleItem(selectedSkills, skill))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isSelected
                                                    ? 'text-white scale-95'
                                                    : 'text-gray-400 hover:text-gray-200 hover:scale-105'
                                                    }`}
                                                style={isSelected ? {
                                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
                                                    border: '1px solid rgba(99,102,241,0.4)',
                                                } : {
                                                    backgroundColor: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                }}
                                            >
                                                {isSelected && <FiCheck className="text-indigo-400 text-xs" />}
                                                {skill}
                                            </button>
                                        );
                                    })}
                                    {skillSearch && filteredSkills.length === 0 && (
                                        <p className="text-xs text-gray-600 py-2">No skills match "{skillSearch}"</p>
                                    )}
                                </div>
                            </div>

                            {/* AI Recommendations */}
                            {recommendations.length > 0 && (
                                <div className="rounded-xl p-4"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
                                        border: '1px solid rgba(99,102,241,0.15)'
                                    }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <HiSparkles className="text-indigo-400 text-sm" />
                                        <p className="text-xs font-semibold text-indigo-300">AI RECOMMENDATIONS</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recommendations.map(({ skill, tag, color }) => (
                                            <span key={skill}
                                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${color}`}>
                                                {skill} → {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── INTERESTS TAB ── */}
                    {activeTab === "interests" && (
                        <div className="grid grid-cols-2 gap-2">
                            {allInterests.map(({ label, icon: Icon, color }) => {
                                const isSelected = selectedInterests.includes(label);
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setSelectedInterests(toggleItem(selectedInterests, label))}
                                        className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group overflow-hidden ${isSelected
                                            ? 'scale-[0.98]'
                                            : 'hover:scale-[1.02]'
                                            }`}
                                        style={isSelected ? {
                                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                                            border: '1px solid rgba(99,102,241,0.4)',
                                        } : {
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                        }}
                                    >
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 opacity-${isSelected ? '100' : '60'} group-hover:opacity-100 transition-opacity`}>
                                            <Icon className="text-white text-sm" />
                                        </div>
                                        <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'} transition-colors`}>
                                            {label}
                                        </span>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                                <FiCheck className="text-white text-xs" style={{ fontSize: '9px' }} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── INTENT TAB ── */}
                    {activeTab === "intent" && (
                        <div className="space-y-3">
                            <p className="text-xs" style={{ color: '#6b6b8a' }}>What brings you to Contributro?</p>
                            {intentOptions.map(option => {
                                const Icon = option.icon;
                                const isSelected = intent === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setIntent(option.value)}
                                        className={`w-full flex items-start gap-4 px-4 py-4 rounded-xl text-left transition-all duration-200 group ${isSelected ? 'scale-[0.99]' : 'hover:scale-[1.01]'}`}
                                        style={isSelected ? {
                                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                                            border: '1px solid rgba(99,102,241,0.4)',
                                            boxShadow: '0 0 20px rgba(99,102,241,0.1)'
                                        } : {
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                        }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'opacity-100 shadow-lg' : 'opacity-50 group-hover:opacity-75'}`}>
                                            <Icon className="text-white text-lg" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold mb-0.5 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'} transition-colors`}>
                                                {option.label}
                                            </p>
                                            <p className="text-xs leading-relaxed" style={{ color: isSelected ? '#9ca3af' : '#4b4b6a' }}>
                                                {option.desc}
                                            </p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-700 group-hover:border-gray-500'}`}>
                                            {isSelected && <FiCheck className="text-white" style={{ fontSize: '10px' }} />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-px mx-6" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

                {/* FOOTER */}
                <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#6b6b8a' }}>
                        {selectedSkills.length > 0 && (
                            <span className="flex items-center gap-1">
                                <FiCode className="text-indigo-400" />
                                {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        {selectedInterests.length > 0 && (
                            <span className="flex items-center gap-1">
                                <FiStar className="text-purple-400" />
                                {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {/* Save button */}
                    <button
                        onClick={handleSubmit}
                        disabled={selectedSkills.length === 0 || saving}
                        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 overflow-hidden ${selectedSkills.length === 0
                            ? 'opacity-40 cursor-not-allowed'
                            : saved
                                ? 'scale-95'
                                : 'hover:scale-105 hover:shadow-lg active:scale-95'
                            }`}
                        style={selectedSkills.length === 0 ? {
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            color: '#4b4b6a',
                            border: '1px solid rgba(255,255,255,0.08)',
                        } : saved ? {
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            color: '#fff',
                            boxShadow: '0 0 20px rgba(16,185,129,0.4)',
                        } : {
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
                            color: '#fff',
                            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                        }}
                    >
                        {/* Shimmer effect */}
                        {!saving && !saved && selectedSkills.length > 0 && (
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                                    animation: 'shimmer 2.5s infinite',
                                }}
                            />
                        )}

                        {saving ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Saving...
                            </>
                        ) : saved ? (
                            <>
                                <FiCheck className="text-base" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <HiSparkles className="text-base" />
                                Save &amp; Continue
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
}

export default SkillsPopUp;
