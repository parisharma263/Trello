import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Boards from './pages/Boards';
import Board from './pages/Board';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';

// Protected Route Component
const ProtectedRoute = ({ children, authLoading }) => {
  if (authLoading) {
    return (
      <div className="status-container">
        <h2>Loading...</h2>
      </div>
    );
  }

  const user = localStorage.getItem('user');
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// Layout for auth screens
function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initDefaultLogin = async () => {
      try {
const res = await axios.get('https://trello-0.onrender.com/auth/default-login');
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (error) {
        console.error('Default login init failed:', error);
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    initDefaultLogin();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={authLoading ? <div /> : user ? <Navigate to="/boards" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={authLoading ? <div /> : user ? <Navigate to="/boards" replace /> : <Signup />}
        />
        <Route 
          path="/boards" 
          element={
            <ProtectedRoute authLoading={authLoading}>
              <Boards />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/board/:id" 
          element={
            <ProtectedRoute authLoading={authLoading}>
              <Board />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute authLoading={authLoading}>
              <Favorites />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute authLoading={authLoading}>
              <Settings />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
