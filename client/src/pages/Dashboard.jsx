import { useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { getUser } from "../services/authServices.js";

function Dashboard() {
  const { login, user } = useContext(AuthContext)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const github_id = params.get('github_id')

    if (token && github_id) {
      getUser(github_id).then(response => {
      login(response.data, token)  
      window.history.replaceState({}, document.title, '/dashboard')
      })
    }
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>
      {user && <p>Welcome, {user.username}</p>}
    </div>
  )
}

export default Dashboard;