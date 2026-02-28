import { useState , useEffect } from 'react'
import axios from 'axios'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [users, setUsers] = useState([]);

  const fetchAPI = async () => {
    const response =  await axios.get('http://localhost:8080/api/users');
    setUsers(response.data.users);
  }

  useEffect(() => {
    fetchAPI();
  }, []); 

  return (
    <>
      
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
          
      
      </div>
     
    </>
  )
}

export default App
