import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  
  const [newUsername, setNewUsername] = useState(user.name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`https://trellooo.onrender.com/users/${user.id}`, { username: newUsername });
      if (res.data.success) {
        setProfileMessage("Username updated successfully!");
        const updatedUser = { ...user, name: newUsername };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setTimeout(() => setProfileMessage(''), 3000);
      }
    } catch (err) {
      setProfileMessage("Failed to update username.");
      setTimeout(() => setProfileMessage(''), 3000);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    try {
      const res = await axios.put(`https://trellooo.onrender.com/users/${user.id}/password`, { oldPassword, newPassword });
      if (res.data.success) {
        setPasswordMessage("Password changed successfully!");
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => setPasswordMessage(''), 3000);
      }
    } catch (err) {
      setPasswordMessage(err.response?.data?.error || "Failed to change password.");
      setTimeout(() => setPasswordMessage(''), 3000);
    }
  };

  const toggleDarkMode = () => {
    alert("Dark mode system logic dynamically connected here.");
  };

  return (
    <div className="boards-dashboard-container">
      {/* Sidebar perfectly mirroring the main view */}
      <aside className="boards-sidebar">
        <div className="sidebar-logo"><span style={{color: '#4318ff'}}>■</span> Trello Clone</div>

        <div style={{ margin: '10px 0 6px', fontWeight: 600 }}>
          Welcome, {user?.name || 'user'}
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'User'}</span>
            <button className="sidebar-logout" onClick={handleLogout}>Log Out</button>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">MENU</div>
          <a href="/boards" className="sidebar-link" onClick={(e) => { e.preventDefault(); navigate('/boards'); }}>
            <span className="sidebar-icon">📊</span> Boards
          </a>
          <a href="/favorites" className="sidebar-link" onClick={(e) => { e.preventDefault(); navigate('/favorites'); }}>
            <span className="sidebar-icon">⭐</span> Favorites
          </a>
          <a href="/settings" className="sidebar-link active" onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
            <span className="sidebar-icon">⚙️</span> Settings
          </a>
        </nav>
      </aside>

      <main className="boards-main-content">
        <div className="boards-workspace">
          <div className="workspace-header">
            <h2 className="workspace-title">Settings</h2>
            <p className="workspace-desc">Manage your account credentials and app preferences.</p>
          </div>

          <div className="settings-grid">
            
            {/* Account Profile Box */}
            <div className="settings-card">
              <h3>Profile Settings</h3>
              <form onSubmit={handleUpdateUsername}>
                <label className="settings-label">Username</label>
                <input 
                  type="text" 
                  className="settings-input" 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)} 
                />
                {profileMessage && <p className="settings-message">{profileMessage}</p>}
                <button type="submit" className="settings-save-btn">Update Profile</button>
              </form>
            </div>

            {/* Password Box */}
            <div className="settings-card">
              <h3>Change Password</h3>
              <form onSubmit={handleUpdatePassword}>
                <label className="settings-label">Current Password</label>
                <input 
                  type="password" 
                  className="settings-input" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                />

                <label className="settings-label">New Password</label>
                <input 
                  type="password" 
                  className="settings-input" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                />
                
                {passwordMessage && <p className="settings-message">{passwordMessage}</p>}
                <button type="submit" className="settings-save-btn">Update Password</button>
              </form>
            </div>

            {/* Application Configuration */}
            <div className="settings-card">
              <h3>App Preferences</h3>
              <div className="settings-pref-row">
                <div className="settings-pref-text">
                  <strong>Dark Mode</strong>
                  <p>Shift the app interface entirely to dark theme.</p>
                </div>
                <button className="settings-toggle-btn" type="button" onClick={toggleDarkMode}>Toggle</button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
export default Settings;
