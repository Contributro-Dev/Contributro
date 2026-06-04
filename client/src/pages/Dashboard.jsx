import { useEffect, useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getUser } from "../services/authServices.js";
import { getAllProjects, joinProject } from "../services/projectServices.js";
import SkillsPopUp from "../components/SkillsPopUp.jsx";
import Sidebar from "../components/Sidebar.jsx";
// import api if you are using api.patch()
// import api from "../services/api.js";

function Dashboard() {
  const { login, user, token } = useContext(AuthContext);

  const [projects, setProjects] = useState([]);


  const [showSkillPopup, setShowSkillPopup] = useState(false)


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
        if (
          !response.data.skills?.length ||
          !response.data.interests?.length ||
          !response.data.intent
        ) {
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

  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";



  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#fff', color: '#000' }}>

      <Sidebar activePage="dashboard" />
      <div>
        



        {/* Modals */}
        {showSkillPopup && <SkillsPopUp onClose={() => setShowSkillPopup(false)} />}
      </div>
    </div>

  );
}

export default Dashboard;