import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handelLogout = () => {
        logout();   
        navigate('/login');
    }

    return (
        <nav className="bg-white shadow p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-orange-600 cursor-pointer" onClick={() => navigate('/dashboard')}>
                Contributro
            </h1>
            <div>
                {user && (
                    <>
                        <span className="text-gray-600 px-3 py-1">Hi, {user.username}</span>
                        <button onClick={() => navigate('/create-project')} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                            + Post Project
                        </button>
                        <button onClick={handelLogout} className="text-red-500 px-3 py-1 hover:text-red-700">
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    )
}

export default Navbar;