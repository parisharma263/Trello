import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../App.css';

const DEFAULT_TIME_LISTS = ['Inbox', 'Today', 'Tomorrow', 'This Week', 'Later'];

const normalizeTitle = (value = '') => value.trim().toLowerCase();

// ==========================================
// 1. Sortable Card Component
// ==========================================
const SortableCard = ({ card, listId, handleDeleteCard, openModal }) => {
  // Use @dnd-kit/sortable to establish drag bindings and positional metrics organically.
  // IMPORTANT: We inject data: { listId } so the event instantly identifies the origin column universally!
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: card.id,
    data: { listId: listId } 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 100 : 'auto', 
  };

  const hasDueDate = card.due_date ? true : false;
  const displayDate = hasDueDate ? new Date(card.due_date).toLocaleDateString() : '';

  // Generate a mock label color based on card ID or title length for visual variety
  const labelColors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];
  const labelColor = labelColors[(card.id || card.title.length) % labelColors.length];

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="task-card" onClick={() => openModal(card)}>
      <div className="card-labels-container">
        <div className="card-label" style={{ backgroundColor: labelColor }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <strong className="task-title">{card.title}</strong>
        <div style={{ display: 'flex' }}>
          <button className="action-card-btn" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handleDeleteCard(e, card.id); }} title="Delete Card">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {card.members && card.members.length > 0 && (
        <div style={{ marginTop: '6px', fontSize: '12px', opacity: 0.85, display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4318ff', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
            {(card.members[0]?.name || 'U').charAt(0).toUpperCase()}
          </span>
          <span>{card.members[0]?.name}</span>
        </div>
      )}

      {card.description && <p className="task-description">{card.description}</p>}
      {hasDueDate && <div className="task-due-date">📅 {displayDate}</div>}
    </div>
  );
};


// ==========================================
// 2. Droppable List Column Component
// ==========================================
const DroppableListWrapper = ({ list, children, handleDeleteList, addingListId, setAddingListId, newCardTitle, setNewCardTitle, handleAddCard }) => {
  // Utilizing useDroppable enforces the List functions as a strictly identifiable target cleanly for when lists are entirely empty!
  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { listId: list.id } // Allows over.data.current.listId cleanly
  });

  return (
    <div ref={setNodeRef} className="list-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="list-header">{list.title}</h3>
        <button className="delete-list-btn" onClick={() => handleDeleteList(list.id)} title="Delete List">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="cards-container">
        {/* We map the children cleanly directly inside the list logic vertically */}
        {children}
      </div>
      
      {addingListId === list.id ? (
        <div className="add-card-form">
          <textarea autoFocus placeholder="Enter card title..." value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(list.id); } if (e.key === 'Escape') { setAddingListId(null); setNewCardTitle(''); } }} className="add-card-input" />
          <div className="add-card-actions">
            <button className="add-card-submit-btn" onClick={() => handleAddCard(list.id)}>Add</button>
            <button className="add-card-cancel-btn" onClick={() => { setAddingListId(null); setNewCardTitle(''); }}>✕</button>
          </div>
        </div>
      ) : (
        <button className="add-card-btn" onClick={() => setAddingListId(list.id)}>+ Add a card</button>
      )}
    </div>
  );
};


// ==========================================
// 3. Main App Structure
// ==========================================
const Board = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [addingListId, setAddingListId] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  // Modal specific State configurations cleanly tracking pop-out structures
  const [modalCard, setModalCard] = useState(null);
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardDescription, setEditCardDescription] = useState('');
  const [editCardDueDate, setEditCardDueDate] = useState('');

  // Checklist state
  const [checklistItems, setChecklistItems] = useState([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [checklistLoading, setChecklistLoading] = useState(false);

  // Native Search local filtration
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ensureDefaultTimeLists = async (existingLists) => {
    const existingTitles = new Set(existingLists.map((list) => normalizeTitle(list.title)));
    const missingTitles = DEFAULT_TIME_LISTS.filter((title) => !existingTitles.has(normalizeTitle(title)));

    if (missingTitles.length === 0) return;

    for (const title of missingTitles) {
      await axios.post('http://localhost:5000/lists', {
        title,
        board_id: id,
        position: existingLists.length + 1,
      });
      existingLists.push({ title });
    }
  };

  const fetchLists = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/boards/${id}/lists`);
      const fetchedLists = response.data;
      await ensureDefaultTimeLists([...fetchedLists]);

      const refreshedResponse = await axios.get(`http://localhost:5000/boards/${id}/lists`);
      setLists(refreshedResponse.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch dashboard data.");
      setLoading(false);
    }
  };

  useEffect(() => { fetchLists(); }, []);


  // --- Standard Event Operations ---
  const handleAddCard = async (listId) => {
    if (!newCardTitle.trim()) { setAddingListId(null); return; }
    try {
      const currentList = lists.find((l) => l.id === listId);
      const position = currentList.cards ? currentList.cards.length + 1 : 1;
      await axios.post('http://localhost:5000/cards', { title: newCardTitle, list_id: listId, position, user_id: user?.id });
      setNewCardTitle('');
      setAddingListId(null);
      fetchLists();
    } catch (err) { alert("Failed to add."); }
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) { setIsAddingList(false); return; }
    try {
      const pos = lists.length + 1;
      await axios.post('http://localhost:5000/lists', { title: newListTitle, board_id: id, position: pos });
      setNewListTitle('');
      setIsAddingList(false);
      fetchLists();
    } catch (err) { alert("Failed to add."); }
  };

  const handleDeleteCard = async (e, cardId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this card?")) return;
    try { await axios.delete(`http://localhost:5000/cards/${cardId}`); fetchLists(); } catch (err) { alert("Failed."); }
  };

  // Fetch checklist for a given card
  const fetchChecklist = async (cardId) => {
    try {
      setChecklistLoading(true);
      const res = await axios.get(`http://localhost:5000/cards/${cardId}/checklist`);
      setChecklistItems(res.data);
    } catch (err) {
      console.error('Failed to fetch checklist', err);
      setChecklistItems([]);
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!modalCard || !newChecklistText.trim()) return;
    try {
      await axios.post('http://localhost:5000/checklist/item', {
        checklist_id: modalCard.id,
        text: newChecklistText.trim(),
      });
      setNewChecklistText('');
      fetchChecklist(modalCard.id);
    } catch (err) {
      console.error('Failed to add checklist item', err);
      alert('Failed to add checklist item');
    }
  };

  const handleToggleChecklistItem = async (itemId) => {
    try {
      await axios.put(`http://localhost:5000/checklist/item/${itemId}`);
      if (modalCard) fetchChecklist(modalCard.id);
    } catch (err) {
      console.error('Failed to toggle checklist item', err);
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    try {
      await axios.delete(`http://localhost:5000/checklist/item/${itemId}`);
      if (modalCard) fetchChecklist(modalCard.id);
    } catch (err) {
      console.error('Failed to delete checklist item', err);
    }
  };

  const openModal = (card) => {
    setModalCard(card);
    setEditCardTitle(card.title || '');
    setEditCardDescription(card.description || '');
    
    // Safely transforms raw generic databases ISO timestamps cleanly matching strict local browser <input type="date"> structures directly natively gracefully!
    if (card.due_date) {
      const formatted = new Date(card.due_date).toISOString().split('T')[0];
      setEditCardDueDate(formatted);
    } else {
      setEditCardDueDate('');
    }

    // Load checklist when modal opens
    fetchChecklist(card.id);
  };

  const closeModal = () => {
    setModalCard(null);
    setChecklistItems([]);
    setNewChecklistText('');
  };

  const handleUpdateCard = async () => {
    if (!modalCard || !editCardTitle.trim()) { alert("Title is mandatory!"); return; }
    try {
      await axios.put(`http://localhost:5000/cards/${modalCard.id}`, { 
        title: editCardTitle, 
        description: editCardDescription,
        due_date: editCardDueDate || null
      });
      closeModal();
      fetchLists(); // Re-sync safely globally cleanly
    } catch (err) { alert("Failed update."); }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm("Delete this entire list?")) return;
    try { await axios.delete(`http://localhost:5000/lists/${listId}`); fetchLists(); } catch (err) { alert("Failed."); }
  };


  // ==========================================
  // PERFECTED DND KIT UNIFIED LOGIC
  // ==========================================
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // 1. Terminate strictly if mouse hovered and released cleanly outside all available valid UI targets
    if (!over) return; 

    // 2. Identify precisely exactly what is taking place via dynamically constructed properties
    const activeId = active.id;
    const overId = over.id;

    // 3. Prevent pointless swaps if users just jitter and dropped over exact same card directly natively
    if (activeId === overId) return; 

    // DETECT SOURCE AND TARGET LISTS (Matches strict requirements precisely!)
    const sourceListId = active.data.current?.listId;
    const targetListId = over.data.current?.listId || over.id; // over.id triggers identically dynamically handling empty dropping zones easily

    if (!sourceListId || !targetListId) return; 

    // =========================================================
    // CASE A: SAME LIST REORDERING (! ArrayMove !)
    // =========================================================
    if (sourceListId === targetListId) {
      setLists((prevLists) => {
        const clonedLists = JSON.parse(JSON.stringify(prevLists));
        const listIndex = clonedLists.findIndex(l => l.id === sourceListId);
        if (listIndex === -1) return prevLists;

        const currentList = clonedLists[listIndex];
        
        // Ascertain local mapping placements relative explicitly
        const oldIndex = currentList.cards.findIndex(c => c.id === activeId);
        const newIndex = currentList.cards.findIndex(c => c.id === overId);
        
        // Execute structural internal swapping smoothly matching visual UX organically!
        currentList.cards = arrayMove(currentList.cards, oldIndex, newIndex);
        
        return clonedLists; // Frontend ONLY! Do not ping Backend per explicit requirements gracefully!
      });

      return; // Fully safely ends propagation
    }


    // =========================================================
    // CASE B: DIFFERENT LIST MOVEMENT (! Updating Backend !)
    // =========================================================
    setLists((prevLists) => {
      const clonedLists = JSON.parse(JSON.stringify(prevLists));
      const sList = clonedLists.find(l => l.id === sourceListId);
      const tList = clonedLists.find(l => l.id === targetListId);
      
      const cardIndex = sList.cards.findIndex(c => c.id === activeId);
      
      // Step A: Remove card securely structurally from old JSON source mapping array natively
      const [removed] = sList.cards.splice(cardIndex, 1);
      
      removed.list_id = targetListId; 
      if (!tList.cards) tList.cards = [];
      
      // Step B: Shove safely to Target list natively visually creating instant UX update feedback
      tList.cards.push(removed);
      
      return clonedLists; 
    });

    // Step C: Update Backend asynchronously silently maintaining UX consistency magically
    try {
      await axios.put(`http://localhost:5000/cards/${activeId}/move`, { list_id: targetListId, position: 1 });
      // Leaving out auto-fetch guarantees your optimistic local mapping array visual layout holds smoothly undisturbed natively
    } catch (error) {
      console.error(error);
      alert("Failed database synchronization. Reverting...");
      fetchLists(); // Rescue natively if things fail securely
    }
  };

  if (loading) return <div className="status-container"><h2>Loading...</h2></div>;
  if (error) return <div className="status-container"><h2 style={{ color: '#ffb3ba' }}>{error}</h2></div>;

  // Render Engine: Filter lists securely before rendering locally generating isolated datasets dynamically avoiding backend calls natively
  const displayedLists = lists.map(list => {
    if (!searchQuery) return list;
    
    const filteredCards = (list.cards || []).filter(card => 
      card.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return { ...list, cards: filteredCards };
  });

  const orderedLists = [
    ...DEFAULT_TIME_LISTS.map((title) =>
      displayedLists.find((list) => normalizeTitle(list.title) === normalizeTitle(title))
    ).filter(Boolean),
    ...displayedLists.filter(
      (list) => !DEFAULT_TIME_LISTS.some((title) => normalizeTitle(title) === normalizeTitle(list.title))
    ),
  ];

  const inboxList = orderedLists.find((list) => normalizeTitle(list.title) === 'inbox');
  const timeLists = orderedLists.filter((list) => normalizeTitle(list.title) !== 'inbox');

  return (
    <div className="board-container">
      <header className="board-header board-header--trello">
        <div className="header-spacer" style={{ display: 'flex', alignItems: 'center' }}>
          <button className="back-btn" onClick={() => navigate('/boards')} title="Back to Boards">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="board-header-main">
          <h1 className="board-title">My Trello board</h1>
          <div className="board-header-subtitle">Welcome, {user?.name || 'user'}</div>
        </div>
        <div className="header-search board-header-actions">
          <input 
            type="text" 
            placeholder="Search cards..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="topbar-create-btn" type="button">Create</button>
        </div>
      </header>
      
      <div className="trello-layout">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          {inboxList && (
            <aside className="inbox-panel">
              <div className="inbox-panel-header">
                <div>
                  <div className="inbox-panel-title">Inbox</div>
                  <div className="inbox-panel-subtitle">{(inboxList.cards || []).length} tasks</div>
                </div>
              </div>

              <DroppableListWrapper
                key={inboxList.id}
                list={inboxList}
                handleDeleteList={handleDeleteList}
                addingListId={addingListId}
                setAddingListId={setAddingListId}
                newCardTitle={newCardTitle}
                setNewCardTitle={setNewCardTitle}
                handleAddCard={handleAddCard}
              >
                <SortableContext items={(inboxList.cards || []).map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {inboxList.cards && inboxList.cards.length > 0 ? (
                    inboxList.cards.map((card) => (
                      <SortableCard
                        key={card.id}
                        card={card}
                        listId={inboxList.id}
                        openModal={openModal}
                        handleDeleteCard={handleDeleteCard}
                      />
                    ))
                  ) : (
                    <div className="inbox-empty-state">Add tasks here, then drag them into a time bucket.</div>
                  )}
                </SortableContext>
              </DroppableListWrapper>
            </aside>
          )}

          <section className="timeline-board">
            <div className="timeline-board-header">
              <div>
                <h2 className="timeline-board-title">My Trello board</h2>
                <p className="timeline-board-description">Drag tasks from Inbox into Today, Tomorrow, This Week, or Later.</p>
              </div>
            </div>

            <div className="lists-wrapper lists-wrapper--timeline">
              {timeLists.map((list) => (
                <DroppableListWrapper 
                  key={list.id} 
                  list={list}
                  handleDeleteList={handleDeleteList}
                  addingListId={addingListId}
                  setAddingListId={setAddingListId}
                  newCardTitle={newCardTitle}
                  setNewCardTitle={setNewCardTitle}
                  handleAddCard={handleAddCard}
                >
                  <SortableContext items={(list.cards || []).map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {list.cards && list.cards.length > 0 ? (
                      list.cards.map((card) => (
                        <SortableCard 
                          key={card.id} 
                          card={card} 
                          listId={list.id} 
                          openModal={openModal}
                          handleDeleteCard={handleDeleteCard}
                        />
                      ))
                    ) : (
                      <div className="timeline-empty-state">Drop a task here</div>
                    )}
                  </SortableContext>
                </DroppableListWrapper>
              ))}

              {isAddingList ? (
                <div className="add-list-form-wrapper">
                  <input autoFocus type="text" placeholder="Enter list title..." value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddList() }} className="add-list-input" />
                  <div className="add-card-actions">
                    <button className="add-card-submit-btn" onClick={handleAddList}>Add list</button>
                    <button className="add-card-cancel-btn" onClick={() => { setIsAddingList(false); setNewListTitle(''); }}>✕</button>
                  </div>
                </div>
              ) : (
                <div className="add-list-wrapper">
                  <button className="add-list-btn" onClick={() => setIsAddingList(true)}>+ Add another list</button>
                </div>
              )}
            </div>
          </section>
        </DndContext>
      </div>

      {/* CARD MODAL OVERLAY */}
      {modalCard && (
        <div className="modal-overlay" onPointerDown={closeModal}>
          <div className="modal-content" onPointerDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Card Details</h2>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <label className="modal-label">Title</label>
              <input 
                type="text" 
                className="modal-input" 
                value={editCardTitle} 
                onChange={(e) => setEditCardTitle(e.target.value)} 
                autoFocus
              />

              <label className="modal-label">Description</label>
              <textarea 
                className="modal-textarea" 
                placeholder="Add a more detailed description..." 
                value={editCardDescription} 
                onChange={(e) => setEditCardDescription(e.target.value)} 
              />

              <label className="modal-label">Due Date</label>
              <input 
                type="date" 
                className="modal-input" 
                value={editCardDueDate} 
                onChange={(e) => setEditCardDueDate(e.target.value)} 
              />

              <label className="modal-label">Assigned to</label>
              <p style={{ marginTop: '6px', marginBottom: '16px', opacity: 0.85 }}>
                {modalCard?.members?.map((m) => m.name).join(', ') || 'None'}
              </p>

              {/* Checklist Section */}
              <div style={{ marginTop: '8px' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Checklist</h3>
                {checklistLoading ? (
                  <p style={{ fontSize: '13px', opacity: 0.8 }}>Loading checklist...</p>
                ) : (
                  <>
                    {checklistItems.length > 0 && (
                      <p style={{ fontSize: '13px', marginBottom: '8px', opacity: 0.8 }}>
                        {
                          `${checklistItems.filter(i => i.is_completed).length}/${checklistItems.length} completed`
                        }
                      </p>
                    )}

                    <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '8px' }}>
                      {checklistItems.map(item => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: item.is_completed ? 'rgba(67, 184, 131, 0.08)' : 'transparent',
                            marginBottom: '4px'
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={!!item.is_completed}
                              onChange={() => handleToggleChecklistItem(item.id)}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span
                              style={{
                                textDecoration: item.is_completed ? 'line-through' : 'none',
                                fontSize: '13px'
                              }}
                            >
                              {item.text}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#e11d48',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginLeft: '8px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}

                      {checklistItems.length === 0 && !checklistLoading && (
                        <p style={{ fontSize: '13px', opacity: 0.8 }}>No checklist items yet.</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <input
                        type="text"
                        placeholder="Add item"
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChecklistItem();
                          }
                        }}
                        style={{
                          flex: 1,
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.7)',
                          padding: '6px 8px',
                          fontSize: '13px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddChecklistItem}
                        style={{
                          border: 'none',
                          background: '#4318ff',
                          color: '#fff',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="modal-save-btn" onClick={handleUpdateCard}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Board;
