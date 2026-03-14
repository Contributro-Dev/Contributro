import {loginWithGithub} from '../services/authServices.js';

function Login() {
  return (
    <div>
      <h1>Welcome to Contributro</h1>
      <button onClick={loginWithGithub}>Login with GitHub</button>
    </div>
  )
}

export default Login;