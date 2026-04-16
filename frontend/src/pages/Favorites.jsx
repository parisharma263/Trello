import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const backgrounds = [
  'linear-gradient(135deg, #0079bf, #5067c5)',
  'linear-gradient(135deg, #d29034, #ffab4a)',
  'linear-gradient(135deg, #519839, #61bd4f)',
  'linear-gradient(135deg, #b04632, #eb5a46)',
  'linear-gradient(135deg, #89609e, #c377e0)',
  'linear-gradient(135deg, #cd5a91, #ff80ce)',
];

const Favorites = () => {
  const [boards, setBoards] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get('https://trellooo.onrender.com/boards');
        // Filter naturally right after fetching
        setBoards(response.data.filter(b => b.is_favorite));
      } catch (err) {
        console.error("Failed to fetch favorite boards", err);
      }
    };
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (e, board) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.put(`https://trellooo.onrender.com/boards/${board.id}/favorite`, { is_favorite: false });
      // Removing it locally from the UI exclusively because it's no longer a favorite!
      setBoards(boards.filter(b => b.id !== board.id));
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="boards-dashboard-container">
      {/* Sidebar perfectly mirroring the main view */}
      <aside className="boards-sidebar">
        <div className="sidebar-logo">
          <span style={{color: '#4318ff'}}>■</span> Trello Clone
        </div>

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
          <a href="/favorites" className="sidebar-link active" onClick={(e) => { e.preventDefault(); navigate('/favorites'); }}>
            <span className="sidebar-icon">⭐</span> Favorites
          </a>
          <a href="/settings" className="sidebar-link" onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
            <span className="sidebar-icon">⚙️</span> Settings
          </a>
        </nav>
      </aside>

      <main className="boards-main-content">
        <div className="boards-workspace">
          <div className="workspace-header">
            <h2 className="workspace-title">Favorites</h2>
            <p className="workspace-desc">Quick access to your most important boards.</p>
          </div>

          <div className="boards-grid-layout">
            {boards.length === 0 && (
              <div className="empty-boards-state">
                <div className="empty-state-icon">⭐</div>
                <p>You have no favorite boards yet.</p>
              </div>
            )}

            {boards.map((board, index) => {
              const bgIndex = index % backgrounds.length;
              return (
                <div 
                  key={board.id} 
                  className="trello-board-card" 
                  style={{ background: backgrounds[bgIndex] }}
                  onClick={() => navigate(`/board/${board.id}`)}
                >
                  <div className="trello-board-card-fade"></div>
                  <div className="trello-board-card-header">
                    <h3 title={board.title}>{board.title}</h3>
                    <button 
                      className="star-btn active" 
                      onClick={(e) => handleToggleFavorite(e, board)}
                      title="Remove from favorites"
                    >
                      ★
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Favorites;
