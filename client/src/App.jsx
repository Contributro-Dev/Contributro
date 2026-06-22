import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Explore from "./pages/Explore.jsx";
import Profile from "./pages/Profile.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import CreateProject from "./pages/CreateProject.jsx";
import Bookmarks from "./pages/Bookmarks.jsx";
import Requests from "./pages/Requests.jsx";
import Projects from "./pages/Projects.jsx"
import Recommendations from "./pages/Recommendations.jsx";

function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element ={<Login />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/profile" element={<Profile />} />
          <Route path ="/projects" element={<Projects />}/>
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/requests" element={<Requests />}/>
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}