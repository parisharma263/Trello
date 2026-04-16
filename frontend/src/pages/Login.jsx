import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css'; // Or inline styling

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/login', { email, password });
      if (res.data.id) {
        // Store user normally using localStorage
        localStorage.setItem('user', JSON.stringify(res.data));
        navigate('/boards');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-visual">
        <h1 className="visual-heading">Organize your work smarter</h1>
        <p className="visual-subtext">Join thousands of teams who build their workflows using our pristine, flexible, and powerful platform.</p>
      </div>
      <div className="auth-form-wrapper">
        <div className="auth-card">
          <div className="auth-logo">Trello Clone</div>
          <h2 className="auth-title">Welcome Back</h2>
          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="auth-btn">Log In</button>
          </form>
          <div className="auth-links-group">
            <Link to="#!" className="forgot-password">Forgot password?</Link>
            <p className="auth-link">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
