import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getUser } from "../services/authServices.js";
import { getAllProjects, joinProject } from "../services/projectServices.js";
import SkillsPopUp from "../components/SkillsPopUp.jsx";

function Dashboard() {
  const { login, user, token } = useContext(AuthContext)
  const [showSkillsPopUp, setShowSkillsPopUp] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const github_id = params.get('github_id')


    if (token && github_id) {
      getUser(github_id).then(response => {
        login(response.data, token)

        if (!response.data.skills || response.data.skills.length === 0) {
          setShowSkillsPopUp(true)
        }

        // This removes the query params from the URL after processing them, so the token isn't visible in the address bar. 👇
        window.history.replaceState({}, document.title, '/dashboard')
      })
    }
  }, [])

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    getAllProjects().then(response => {
      setProjects(response.data);
    });
  }, []);

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


  // Display the dashboard 👇


  return (
    <div className="max-w-2xl mx-auto p-4">
      {showSkillsPopUp && <SkillsPopUp onClose={() => setShowSkillsPopUp(false)} />}
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {user && <p className="text-lg">Welcome, {user.username}</p>}
      {projects.map(project => {
        const isMember = project.members.includes(String(user?.github_id))
        const isOwner = project.owner_github_id === String(user?.github_id)

        return (
          <div key={project._id} className="border border-gray-300 p-4 mb-4 mt-10 rounded">
            <h3 className="text-xl font-semibold">{project.title}</h3>
            <p className="text-gray-600">{project.description}</p>
            <p className="text-sm text-gray-500">Skills: {project.required_skills.join(', ')}</p>
            <p className="text-sm text-gray-500">Team size: {project.team_size}</p>
            <p className="text-sm text-gray-500">Timeline: {project.timeline}</p>

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
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Join Project
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Dashboard;