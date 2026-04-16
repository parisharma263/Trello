import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://trello-mi7p.onrender.com/signup', { name, email, password });
      alert('Signup successful! Please log in.');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Signup failed');
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
          <h2 className="auth-title">Create an Account</h2>
          <form onSubmit={handleSignup} className="auth-form">
            <input
              type="text"
              placeholder="Name"
              className="auth-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
            <button type="submit" className="auth-btn">Sign Up</button>
          </form>
          <div className="auth-links-group">
            <p className="auth-link">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
