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


  const [showSkillPopup, setShowSkillPopup] = useState(true)

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0d0d0f', color: '#e4e4e8' }}>




      {/* TOP NAVBAR */}
      <div style={{ height: '60px', borderBottom: '1px solid #2a2a30', display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backDropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-8  ">
          {/* logo + tab */}
          <span className="font-bold text-lg"> Contributro </span>
          <div className="flex items-center alignItems-center gap-4" style={{ fontSize: '0.9rem', fontWeight: '500', fontFamily: 'revert', marginTop: '0.2rem' }}>
            <a className="hover:text-gray-400 cursor-pointer">
              Dashboard
            </a>
            <a className="hover:text-gray-400 cursor-pointer">
              Browse
            </a>
            <a className="hover:text-gray-400 cursor-pointer">
              Recomendation
            </a>
          </div>

        </div>

        <div className="flex items-center gap-4">
          <div className="flex rounded-full bg-gray-800 text-gray-300 w-9 h-9 justify-center items-center cursor-pointer font-medium" style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}>
            {firstLetter}
          </div>
          <button style={{ backgroundColor: '#6da6e3', color: '#111', padding: '0.3rem 1rem', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
            Post a project
          </button>
        </div>

      </div>

      {/* Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <div style={{ width: '220px', borderRight: '1px solid #2a2a30' }}>
          <div className="flex flex-col gap-1 p-6 border-b border-gray-800">
            <span className=" uppercase text-[.9rem] font-medium text-sky-300 gap-2 flex items-center">
              <span className="size-2 rounded-full bg-sky-200"></span>
              Developer console</span>
            <span className="uppercase text-[10px]">Verified architect</span>
          </div>
          <div className="flex flex-col gap-1 mt-6 text-m text-gray-500 font-medium">

            <a className="hover:text-sky-400 cursor-pointer flex items-center gap-3 hover:bg-gray-800 hover:border-l-2 border-sky-400 px-6 py-2 ease-in-out duration-200">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              Home
            </a>
            <a className="hover:text-sky-400 cursor-pointer flex items-center gap-3 hover:bg-gray-800 hover:border-l-2 border-sky-400 px-6 py-2 ease-in-out duration-200">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              Projects
            </a>
            <a className="hover:text-sky-400 cursor-pointer flex items-center gap-3 hover:bg-gray-800 hover:border-l-2 border-sky-400 px-6 py-2 ease-in-out duration-200">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              Analytics
            </a>
            <a className="hover:text-sky-400 cursor-pointer flex items-center gap-3 hover:bg-gray-800 hover:border-l-2 border-sky-400 px-6 py-2 ease-in-out duration-200">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
              Settings
            </a>
          </div>

          <div className="flex flex-col gap-1 mt-52 text-m text-gray-500 font-medium">
            <a className="hover:text-gray-300 cursor-pointer flex items-center gap-3 hover:bg-red-800 hover:border-l-2 border-red-400 px-6 py-2 ease-in-out duration-200">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              logout
            </a>
          </div>

        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

        </div>

      </div>

      {/* Modals */}
      {showSkillPopup && <SkillsPopUp onClose={() => setShowSkillPopup(false)}/>}
    </div>

  );
}

export default Dashboard;