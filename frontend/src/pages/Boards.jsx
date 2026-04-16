import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

// Authentic Trello-like gradients for board thumbnails
const backgrounds = [
  'linear-gradient(135deg, #0079bf, #5067c5)',
  'linear-gradient(135deg, #d29034, #ffab4a)',
  'linear-gradient(135deg, #519839, #61bd4f)',
  'linear-gradient(135deg, #b04632, #eb5a46)',
  'linear-gradient(135deg, #89609e, #c377e0)',
  'linear-gradient(135deg, #cd5a91, #ff80ce)',
];

const Boards = () => {
  const [boards, setBoards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [menuOpenForBoard, setMenuOpenForBoard] = useState(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [boardToRename, setBoardToRename] = useState(null);
  const [renameBoardTitle, setRenameBoardTitle] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await axios.get('http://localhost:5000/boards');
        setBoards(response.data);
      } catch (err) {
        console.error("Failed to fetch boards", err);
      }
    };
    fetchBoards();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDotsClick = (e, boardId) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpenForBoard(menuOpenForBoard === boardId ? null : boardId);
  };

  const handleToggleFavorite = async (e, board) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavStatus = !board.is_favorite;
    try {
      await axios.put(`http://localhost:5000/boards/${board.id}/favorite`, { is_favorite: newFavStatus });
      setBoards(boards.map(b => b.id === board.id ? { ...b, is_favorite: newFavStatus } : b));
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const handleRenameBoardSubmit = async () => {
    if (!renameBoardTitle.trim()) return;
    try {
      await axios.put(`http://localhost:5000/boards/${boardToRename.id}`, { title: renameBoardTitle });
      setBoards(boards.map(b => b.id === boardToRename.id ? { ...b, title: renameBoardTitle } : b));
      setIsRenameModalOpen(false);
      setRenameBoardTitle('');
      setMenuOpenForBoard(null);
    } catch (err) {
      console.error('Failed to rename board', err);
      alert('Failed to rename board');
    }
  };

  const handleDeleteBoard = async (e, boardId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this board and all its nested lists/cards?')) {
      try {
        await axios.delete(`http://localhost:5000/boards/${boardId}`);
        setBoards(boards.filter(b => b.id !== boardId));
      } catch (err) {
        console.error('Failed to delete board', err);
        alert('Failed to delete board');
      }
    }
    setMenuOpenForBoard(null);
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) {
      alert('Board title is required');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/boards', { 
        title: newBoardTitle, 
        owner_id: user.id 
      });
      if (response.data.success) {
        setBoards([...boards, response.data.board]);
        setIsModalOpen(false);
        setNewBoardTitle('');
      }
    } catch (err) {
      console.error(err.response?.data);
      alert(err.response?.data?.error || 'Failed to create board');
    }
  };

  return (
    <div className="boards-dashboard-container">
      {/* Sidebar */}
      <aside className="boards-sidebar">
        <div className="sidebar-logo">
          <span style={{color: '#4318ff'}}>■</span> Trello Clone
        </div>

        <div style={{ margin: '10px 0 6px', fontWeight: 600 }}>
          Welcome, {user?.name || 'user'}
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'User'}</span>
            <button className="sidebar-logout" onClick={handleLogout}>Log Out</button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">MENU</div>
          <a href="/boards" className="sidebar-link active" onClick={(e) => { e.preventDefault(); navigate('/boards'); }}>
            <span className="sidebar-icon">📊</span> Boards
          </a>
          <a href="/favorites" className="sidebar-link" onClick={(e) => { e.preventDefault(); navigate('/favorites'); }}>
            <span className="sidebar-icon">⭐</span> Favorites
          </a>
          <a href="/settings" className="sidebar-link" onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
            <span className="sidebar-icon">⚙️</span> Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="boards-main-content">
        <div className="boards-workspace">
          <div className="workspace-header">
            <h2 className="workspace-title">Your Workspace</h2>
            <p className="workspace-desc">Manage all your boards and organize your projects efficiently.</p>
          </div>

          <div className="boards-grid-layout">
            {boards.length === 0 && (
              <div className="empty-boards-state">
                <div className="empty-state-icon">📋</div>
                <p>Create your first board to get started</p>
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
                  onMouseLeave={() => setMenuOpenForBoard(null)}
                >
                  <div className="trello-board-card-fade"></div>
                  <div className="trello-board-card-header">
                    <h3 title={board.title}>{board.title}</h3>
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                      <button 
                        className={`star-btn ${board.is_favorite ? 'active' : ''}`} 
                        onClick={(e) => handleToggleFavorite(e, board)}
                      >
                        {board.is_favorite ? '★' : '☆'}
                      </button>
                      <button className="board-options-btn" onClick={(e) => handleDotsClick(e, board.id)}>⋮</button>
                    </div>

                    {menuOpenForBoard === board.id && (
                      <div className="board-options-menu" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setBoardToRename(board); setRenameBoardTitle(board.title); setIsRenameModalOpen(true); setMenuOpenForBoard(null); }}>Rename Board</button>
                        <button className="delete-text" onClick={(e) => handleDeleteBoard(e, board.id)}>Delete Board</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="trello-board-card create-new-board-dashed" onClick={() => setIsModalOpen(true)}>
              <h3>+ Create new board</h3>
            </div>
          </div>
        </div>
      </main>

      {isRenameModalOpen && (
        <div className="modal-overlay" onPointerDown={() => setIsRenameModalOpen(false)}>
          <div className="modal-content" onPointerDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rename board</h2>
              <button className="modal-close-btn" onClick={() => setIsRenameModalOpen(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <label className="modal-label">Board Title</label>
              <input 
                type="text" 
                className="modal-input" 
                placeholder="Enter board title"
                value={renameBoardTitle} 
                onChange={(e) => setRenameBoardTitle(e.target.value)} 
                autoFocus
              />
            </div>
            
            <div className="modal-footer">
              <button className="modal-save-btn" onClick={handleRenameBoardSubmit}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onPointerDown={() => setIsModalOpen(false)}>
          <div className="modal-content" onPointerDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create board</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <label className="modal-label">Board Title</label>
              <input 
                type="text" 
                className="modal-input" 
                placeholder="Enter board title"
                value={newBoardTitle} 
                onChange={(e) => setNewBoardTitle(e.target.value)} 
                autoFocus
              />
            </div>
            
            <div className="modal-footer">
              <button className="modal-save-btn" onClick={handleCreateBoard}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Boards;
