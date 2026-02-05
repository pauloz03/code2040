import './App.css'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'

function Home() {
  const navigate = useNavigate()
  return (
    <>
      <h1>Reporters</h1>
      <div className="card">
        <button onClick={() => navigate('/login')}>Log In</button>
        <button onClick={() => navigate('/signup')}>Sign Up</button>
      </div>
    </>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App
