import React, { useState, useContext } from 'react'
import { AuthContext } from '../auth/AuthContext'
import '../App.css'
import { useNavigate } from 'react-router-dom'

function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signup } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signup(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Could not sign up. Try again.')
    }
  }

  return (
    <div className="auth-page">
      <h1>Sign Up</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
        {error && <p className="error-msg">{error}</p>}
      </form>
      <button className="switch-btn" onClick={() => navigate('/login')}>Log In</button>
    </div>
  )
}

export default Signup