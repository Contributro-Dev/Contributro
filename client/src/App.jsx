import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import Home from './pages/home.jsx';  
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Explore from './pages/Explore.jsx'
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import CreateProject from './pages/CreateProject.jsx';
import Profile from './pages/Profile.jsx';
import Navbar from './components/Navbar.jsx';
import Bookmarks from './pages/Bookmarks';

function App() {
  const { user } = useContext(AuthContext)
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/explore" element={<Explore />}/>
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App;