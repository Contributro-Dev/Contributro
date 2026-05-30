import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getUser } from "../services/authServices.js";
import { getAllProjects, joinProject } from "../services/projectServices.js";
import SkillsPopUp from "../components/SkillsPopUp.jsx";
// import api if you are using api.patch()
// import api from "../services/api.js";

function Dashboard() {
  const { login, user, token } = useContext(AuthContext);

  const [projects, setProjects] = useState([]);

  // Skill popup states
  const [showSkillPopup, setShowSkillPopup] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  // ─────────────────────────────────────────────
  // Handle GitHub OAuth redirect
  // ─────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const urlToken = params.get("token");
    const github_id = params.get("github_id");
    const isNewUser = params.get("new_user") === "true";

    if (urlToken && github_id) {
      getUser(github_id).then((response) => {
        login(response.data, urlToken);

        // Remove token from URL
        window.history.replaceState({}, document.title, "/dashboard");

        // Show popup if user has no skills
        if (isNewUser || response.data.skills?.length === 0) {
          setShowSkillPopup(true);
        }
      });
    } else if (user && user.skills?.length === 0) {
      setShowSkillPopup(true);
    }
  }, []);

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





  return (
    <div className="max-w-2xl mx-auto p-4">

      {/* Skills Popup */}
      {showSkillPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 28,
              width: 400,
              maxWidth: "90vw",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              What are your skills?
            </h2>

            <p
              style={{
                fontSize: 13,
                color: "#666",
                marginBottom: 16,
              }}
            >
              Add your skills so we can recommend the best projects for you.
            </p>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleAddSkill()
                }
                placeholder="e.g. React, Python, MongoDB..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 14,
                }}
              />

              <button
                onClick={handleAddSkill}
                style={{
                  padding: "8px 16px",
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Add
              </button>
            </div>

            {/* Selected skills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 20,
              }}
            >
              {selectedSkills.map((s) => (
                <span
                  key={s}
                  onClick={() =>
                    setSelectedSkills(
                      selectedSkills.filter((x) => x !== s)
                    )
                  }
                  style={{
                    background: "#eef2ff",
                    color: "#4338ca",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {s} 
                </span>
              ))}
            </div>

            <button
              onClick={handleSaveSkills}
              disabled={selectedSkills.length === 0}
              style={{
                width: "100%",
                padding: "10px",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                cursor: "pointer",
                fontWeight: 600,
                opacity: selectedSkills.length === 0 ? 0.5 : 1,
              }}
            >
              Save Skills
            </button>
          </div>
        </div>
      )}

      {/* Dashboard */}
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {user && (
        <p className="text-lg">
          Welcome, {user.username}
        </p>
      )}

      {projects.map((project) => {
        const isMember = project.members?.includes(
          String(user?.github_id)
        );

        const isOwner =
          project.owner_github_id ===
          String(user?.github_id);

        return (
          <div
            key={project._id}
            className="border border-gray-300 p-4 mb-4 mt-10 rounded"
          >
            <h3 className="text-xl font-semibold">
              {project.title}
            </h3>

            <p className="text-gray-600">
              {project.description}
            </p>

            <p className="text-sm text-gray-500">
              Skills: {project.required_skills?.join(", ")}
            </p>

            <p className="text-sm text-gray-500">
              Team size: {project.team_size}
            </p>

            <p className="text-sm text-gray-500">
              Timeline: {project.timeline}
            </p>

            {isOwner ? (
              <button className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed">
                Your Project
              </button>
            ) : isMember ? (
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg cursor-not-allowed">
                Joined ✓
              </button>
            ) : (
              <button
                onClick={() => handleJoinProject(project._id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Join Project
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Dashboard;