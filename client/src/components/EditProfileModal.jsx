import { useState, useEffect } from "react";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import "./EditProfileModal.css";

export default function EditProfileModal({ initialData, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name: "",
    bio: "",
    location: "",
    portfolio: "",
    status: "",
    avatar: "",
    skills: [],
    interests: [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        bio: initialData.bio || "",
        location: initialData.location || "",
        portfolio: initialData.portfolio || initialData.website || "",
        status: initialData.status || "",
        avatar: initialData.avatar || "",
        skills: Array.isArray(initialData.skills) ? [...initialData.skills] : [],
        interests: Array.isArray(initialData.interests) ? [...initialData.interests] : [],
      });
      setSkillInput("");
      setInterestInput("");
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    const val = skillInput.trim();
    if (val && !form.skills.includes(val)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, val] }));
    }
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const addInterest = () => {
    const val = interestInput.trim();
    if (val && !form.interests.includes(val)) {
      setForm((prev) => ({ ...prev, interests: [...prev.interests, val] }));
    }
    setInterestInput("");
  };

  const removeInterest = (interest) => {
    setForm((prev) => ({ ...prev, interests: prev.interests.filter((i) => i !== interest) }));
  };

  const handleSubmit = () => {
    onSave({ ...form });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile</h2>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
          </div>

          <div className="modal-field">
            <label>Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Tell the world about yourself" rows={3} />
          </div>

          <div className="modal-field">
            <label>Location</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="City, Country" />
          </div>

          <div className="modal-field">
            <label>Portfolio URL</label>
            <input name="portfolio" value={form.portfolio} onChange={handleChange} placeholder="https://yourportfolio.dev" />
          </div>

          <div className="modal-field">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="">Select status</option>
              <option value="Looking for Projects">Looking for Projects</option>
              <option value="Open to Collaborate">Open to Collaborate</option>
              <option value="Busy">Busy</option>
              <option value="Hiring">Hiring</option>
            </select>
          </div>

          <div className="modal-field">
            <label>Avatar URL</label>
            <input name="avatar" value={form.avatar} onChange={handleChange} placeholder="https://example.com/avatar.png" />
          </div>

          <div className="modal-field">
            <label>Skills</label>
            <div className="tag-input-row">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill and press Enter"
              />
              <button className="tag-add-btn" onClick={addSkill} type="button">
                <FiPlus size={16} />
              </button>
            </div>
            <div className="tag-list">
              {form.skills.map((skill) => (
                <span key={skill} className="tag-chip">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>
                    <FiTrash2 size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <label>Interests</label>
            <div className="tag-input-row">
              <input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(); } }}
                placeholder="Add an interest and press Enter"
              />
              <button className="tag-add-btn" onClick={addInterest} type="button">
                <FiPlus size={16} />
              </button>
            </div>
            <div className="tag-list">
              {form.interests.map((interest) => (
                <span key={interest} className="tag-chip">
                  {interest}
                  <button type="button" onClick={() => removeInterest(interest)}>
                    <FiTrash2 size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}