import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { updateSkills } from '../services/userService.js';

const allSkills = ["Python", "JavaScript", "React", "Node.js", "Flask", "Django",
    "MongoDB", "PostgreSQL", "MySQL", "TypeScript", "Java", "C++",
    "Machine Learning", "Deep Learning", "Data Science", "Computer Vision",
    "NLP", "Docker", "Kubernetes", "AWS", "Firebase", "GraphQL",
    "REST APIs", "Git", "Linux", "Figma", "UI/UX", "Tailwind CSS", "Bootstrap", "Next.js", "Gatsby", "Redux", "Vue.js", "Angular"];

function toggleSkill(skills, skill) {
    if (skills.includes(skill)) {
        return skills.filter(s => s !== skill);
    } else {
        return [...skills, skill];
    }
}


function SkillsPopUp({ onClose }) {
    const { user, token, updateUser } = useContext(AuthContext);
    const [selectedSkills, setSelectedSkills] = useState(user.skills || []);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSkills = allSkills.filter(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    function handleToggle(skill) {
        const updateSkill = toggleSkill(selectedSkills, skill);
        setSelectedSkills(updateSkill);
    }

    function handleSubmit() {
        updateSkills(token, user.github_id, { skills: selectedSkills })
            .then(res => {
                updateUser({ skills: selectedSkills });
                onClose();
            })
            .catch(err => {
                console.error("Failed to update skills", err);
            });
    }

    return (
        <div style={{ height: '100%', width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', position: 'fixed', top: 0, left: 0 }}>
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#1e1e1e',
                padding: '2rem',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                width: '400px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            }}>
                <h2 style={{ color: '#e0e0e0', textAlign: 'center' }}>
                    Update Your Skills
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search skills..."
                        style={{   color: '#e0e0e0', backgroundColor: '#333', border: '1px solid #555', padding: '0.5rem', borderRadius: '4px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                    {selectedSkills.map(skill => (
                        <span key={skill} style={{ backgroundColor: '#416891', color: '#fff', padding: '0.5rem', borderRadius: '4px' }}>
                            {skill} <button onClick={() => handleToggle(skill)} style={{ background: 'none', border: 'none', color: '#e0e0e0', cursor: 'pointer' }}>x</button>
                        </span>
                    ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                    {searchQuery && filteredSkills.map(skill => (
                        <div
                            key={skill}
                            style={{
                                backgroundColor: selectedSkills.includes(skill) ? '#416891' : '#333',
                                color: selectedSkills.includes(skill) ? '#fff' : '#e0e0e0',
                                border: '1px solid #555',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                            onClick={() => handleToggle(skill)}
                        >
                            {skill}
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleSubmit}
                    style={{
                        backgroundColor: '#778a9f',
                        color: '#fff',
                        border: 'none',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Update Skills
                </button>
            </div>
        </div>
    )
}

export default SkillsPopUp;
