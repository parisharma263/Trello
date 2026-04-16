const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import our Database connection
const bcrypt = require('bcrypt');
const seedData = require('./seed'); // 👈 top pe
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Default auth simulation (no JWT/session).
const DEFAULT_USER = {
  username: 'user',
  email: 'user@gmail.com',
  password: 'user123',
};

async function seedDefaultUserIfMissing() {
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [DEFAULT_USER.email]);
  if (existing.length > 0) return existing[0].id;

  const hashedPassword = await bcrypt.hash(DEFAULT_USER.password, 10);
  const [result] = await db.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [DEFAULT_USER.username, DEFAULT_USER.email, hashedPassword]
  );
  return result.insertId;
}

async function linkAllDataToDefaultUser(defaultUserId) {
  // Ensure all boards are owned by the default user.
  await db.query(
    'UPDATE boards SET owner_id = ? WHERE owner_id IS NULL OR owner_id <> ?',
    [defaultUserId, defaultUserId]
  );

  // Ensure card membership is exclusively the default user (assignment requirement).
  await db.query('DELETE FROM card_members WHERE user_id <> ?', [defaultUserId]);

  // Ensure all cards have the default user as a member.
  await db.query(
    `
      INSERT INTO card_members (card_id, user_id)
      SELECT c.id, ?
      FROM cards c
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `,
    [defaultUserId]
  );
}

async function seedDefaultUserAndLinkData() {
  const defaultUserId = await seedDefaultUserIfMissing();
  await linkAllDataToDefaultUser(defaultUserId);
  return defaultUserId;
}

app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

// A route deliberately setup to test our Database connection
app.get('/api/test-db', async (req, res) => {
  try {
    // We use async await here to query the DB
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    
    res.json({
      success: true,
      message: 'Database Connection Successful!',
      sqlResult: rows[0].solution // Will return 2
    });
  } catch (error) {
    console.error('Database configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Database Connection Failed. Check your credentials.',
      error: error.message
    });
  }
});

// User Signup
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    res.status(201).json({ success: true, message: 'User registered successfully!' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to sign up', details: error.message });
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await db.query('SELECT id, username, email, password_hash FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ id: user.id, name: user.username, email: user.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// Default login endpoint (simulates auth with a seeded user).
app.get('/auth/default-login', async (req, res) => {
  try {
    // Ensure the user exists and the data is linked at least once.
    const defaultUserId = await seedDefaultUserAndLinkData();

    const [users] = await db.query(
      'SELECT id, email, username FROM users WHERE id = ?',
      [defaultUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Default user not found after seeding' });
    }

    res.json({
      id: users[0].id,
      email: users[0].email,
      name: users[0].username,
    });
  } catch (error) {
    console.error('Default-login error:', error);
    res.status(500).json({ error: 'Failed to fetch default user', details: error.message });
  }
});

// Fetch all boards from the database
app.get('/boards', async (req, res) => {
  try {
    const [boards] = await db.query('SELECT * FROM boards');
    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch boards from the database' });
  }
});

// Create a new board
app.post('/boards', async (req, res) => {
  try {
    const { title, owner_id } = req.body;
    
    // Strict Validation
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!owner_id) {
      console.error('Missing owner_id payload on board creation request.');
      return res.status(400).json({ error: 'owner_id is deeply required to assign board ownership' });
    }
    
    // Execute string-safe insertion using placeholders
    const [result] = await db.query(
      'INSERT INTO boards (title, owner_id) VALUES (?, ?)',
      [title, owner_id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      board: { id: result.insertId, title, owner_id }
    });
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ error: 'Failed to create board in the database', details: error.message });
  }
});

// Update a board
app.put('/boards/:id', async (req, res) => {
  try {
    const boardId = req.params.id;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const [result] = await db.query('UPDATE boards SET title = ? WHERE id = ?', [title, boardId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Board not found' });
    res.json({ success: true, message: 'Board updated successfully' });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: 'Failed to update board', details: error.message });
  }
});

// Delete a board
app.delete('/boards/:id', async (req, res) => {
  try {
    const boardId = req.params.id;
    await db.query('DELETE c FROM cards c JOIN lists l ON c.list_id = l.id WHERE l.board_id = ?', [boardId]);
    await db.query('DELETE FROM lists WHERE board_id = ?', [boardId]);
    const [result] = await db.query('DELETE FROM boards WHERE id = ?', [boardId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Board not found' });
    res.json({ success: true, message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ error: 'Failed to delete board', details: error.message });
  }
});

// Toggle Favorite Board
app.put('/boards/:id/favorite', async (req, res) => {
  try {
    const { is_favorite } = req.body;
    await db.query('UPDATE boards SET is_favorite = ? WHERE id = ?', [is_favorite, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite', details: error.message });
  }
});

// Update user settings (username)
app.put('/users/:id', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });
    await db.query('UPDATE users SET username = ? WHERE id = ?', [username, req.params.id]);
    res.json({ success: true, message: 'Username updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// Update user password
app.put('/users/:id/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Passwords required' });
    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.params.id]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    
    const match = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Incorrect old password' });
    
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.params.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password', details: error.message });
  }
});



// Fetch all lists and their nested cards for a specific board
app.get('/boards/:id/lists', async (req, res) => {
  try {
    const boardId = req.params.id;
    
    // 1. Fetch all lists belonging to the board, ordered by their position
    const [lists] = await db.query('SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC', [boardId]);
    
    // 2. Fetch cards for each list concurrently using Promise.all
    const listsWithCards = await Promise.all(lists.map(async (list) => {
      const [cards] = await db.query('SELECT * FROM cards WHERE list_id = ? ORDER BY position ASC', [list.id]);
      
      // Attach card members to each card so the frontend can show assignments.
      const cardsWithMembers = await Promise.all(
        cards.map(async (card) => {
          const [members] = await db.query(
            `
              SELECT u.id, u.email, u.username AS name
              FROM card_members cm
              JOIN users u ON cm.user_id = u.id
              WHERE cm.card_id = ?
              ORDER BY u.id ASC
            `,
            [card.id]
          );
          return { ...card, members };
        })
      );

      // Return the original list object, but attach a new 'cards' array to it
      return {
        ...list,
        cards: cardsWithMembers
      };
    }));
    
    res.json(listsWithCards);
  } catch (error) {
    console.error('Error fetching lists and cards:', error);
    res.status(500).json({ error: 'Failed to fetch lists and cards from the database' });
  }
});

// Add a new card
app.post('/cards', async (req, res) => {
  try {
    const { title, description, list_id, position, user_id } = req.body;
    
    // Basic validation
    if (!title || !list_id || position === undefined) {
      return res.status(400).json({ error: 'Title, list_id, and position are required' });
    }
    
    // Execute string-safe insertion using placeholders
    const [result] = await db.query(
      'INSERT INTO cards (list_id, title, description, position) VALUES (?, ?, ?, ?)',
      [list_id, title, description || null, position]
    );

    // Ensure the card is linked to a member (default user if not provided).
    const effectiveUserId = user_id || (await seedDefaultUserIfMissing());
    await db.query(
      'INSERT INTO card_members (card_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)',
      [result.insertId, effectiveUserId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Card created successfully',
      cardId: result.insertId // Provide the dynamically created Auto-Incremented ID
    });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ error: 'Failed to create card in the database' });
  }
});

// Update a card's title and description
app.put('/cards/:id', async (req, res) => {
  try {
    const cardId = req.params.id;
    const { title, description, due_date } = req.body;
    
    // Basic validation
    if (!title) {
      return res.status(400).json({ error: 'Title is required to update the card' });
    }
    
    // Execute an UPDATE query dynamically applying due_date
    const [result] = await db.query(
      'UPDATE cards SET title = ?, description = ?, due_date = ? WHERE id = ?',
      [title, description || null, due_date || null, cardId]
    );
    
    // Check if the card with the supplied ID actually existed in the DB
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json({
      success: true,
      message: 'Card updated successfully'
    });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card in the database' });
  }
});

// Delete a card by ID
app.delete('/cards/:id', async (req, res) => {
  try {
    const cardId = req.params.id;
    
    // Execute a DELETE query
    const [result] = await db.query('DELETE FROM cards WHERE id = ?', [cardId]);
    
    // Check if the card with the supplied ID actually existed in the DB
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card from the database' });
  }
});

// =========================
// Checklist APIs (per card)
// =========================

// Get checklist items for a specific card
app.get('/cards/:id/checklist', async (req, res) => {
  try {
    const cardId = req.params.id;
    const [items] = await db.query(
      'SELECT id, content AS text, is_completed FROM checklist_items WHERE card_id = ? ORDER BY position ASC, id ASC',
      [cardId]
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching checklist items:', error);
    res.status(500).json({ error: 'Failed to fetch checklist items', details: error.message });
  }
});

// Create a checklist for a card (simple: one checklist per card, so this is a no-op helper)
app.post('/checklist', async (req, res) => {
  try {
    const { card_id } = req.body;
    if (!card_id) {
      return res.status(400).json({ error: 'card_id is required' });
    }
    // We treat "one checklist per card", so the card itself is the checklist.
    res.status(201).json({ checklistId: card_id });
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ error: 'Failed to create checklist', details: error.message });
  }
});

// Add item (text, checklist_id)
app.post('/checklist/item', async (req, res) => {
  try {
    const { checklist_id, text } = req.body;
    if (!checklist_id || !text) {
      return res.status(400).json({ error: 'checklist_id and text are required' });
    }

    // checklist_id is the card_id in our schema
    const cardId = checklist_id;

    // Find next position
    const [rows] = await db.query(
      'SELECT COALESCE(MAX(position), 0) AS maxPos FROM checklist_items WHERE card_id = ?',
      [cardId]
    );
    const nextPosition = (rows[0]?.maxPos || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO checklist_items (card_id, content, is_completed, position) VALUES (?, ?, FALSE, ?)',
      [cardId, text, nextPosition]
    );

    res.status(201).json({
      success: true,
      item: { id: result.insertId, text, is_completed: 0, card_id: cardId }
    });
  } catch (error) {
    console.error('Error adding checklist item:', error);
    res.status(500).json({ error: 'Failed to add checklist item', details: error.message });
  }
});

// Toggle complete/incomplete
app.put('/checklist/item/:id', async (req, res) => {
  try {
    const itemId = req.params.id;

    // Toggle the boolean flag
    const [currentRows] = await db.query(
      'SELECT is_completed FROM checklist_items WHERE id = ?',
      [itemId]
    );
    if (!currentRows.length) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    const current = currentRows[0].is_completed ? 1 : 0;
    const next = current ? 0 : 1;

    await db.query(
      'UPDATE checklist_items SET is_completed = ? WHERE id = ?',
      [next, itemId]
    );

    res.json({ success: true, is_completed: !!next });
  } catch (error) {
    console.error('Error toggling checklist item:', error);
    res.status(500).json({ error: 'Failed to toggle checklist item', details: error.message });
  }
});

// Delete checklist item
app.delete('/checklist/item/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const [result] = await db.query('DELETE FROM checklist_items WHERE id = ?', [itemId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    res.status(500).json({ error: 'Failed to delete checklist item', details: error.message });
  }
});

// Add a new List Column
app.post('/lists', async (req, res) => {
  try {
    const { title, board_id, position } = req.body;
    
    // Basic validation
    if (!title || !board_id || position === undefined) {
      return res.status(400).json({ error: 'Title, board_id, and position are required' });
    }
    
    // Execute string-safe insertion using placeholders
    const [result] = await db.query(
      'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
      [board_id, title, position]
    );
    
    res.status(201).json({
      success: true,
      message: 'List created successfully',
      listId: result.insertId // Return the auto-generated ID from MySQL database
    });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: 'Failed to create list in the database' });
  }
});

// Delete an entire List Column and its cards (via CASCADE)
app.delete('/lists/:id', async (req, res) => {
  try {
    const listId = req.params.id;
    
    // Execute a secure DELETE query
    const [result] = await db.query('DELETE FROM lists WHERE id = ?', [listId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'List not found' });
    }
    
    res.json({
      success: true,
      message: 'List deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: 'Failed to delete list from the database' });
  }
});

// Move a card smoothly updating list assignments internally
app.put('/cards/:id/move', async (req, res) => {
  try {
    const cardId = req.params.id;
    const { list_id, position } = req.body;
    
    await db.query(
      'UPDATE cards SET list_id = ?, position = ? WHERE id = ?',
      [list_id, position, cardId]
    );
    
    res.json({ success: true, message: 'Card relocated successfully' });
  } catch (error) {
    console.error('Error relocating card:', error);
    res.status(500).json({ error: 'Failed to properly move the card node in the database' });
  }
});



const startServer = async () => {
  try {
    // ✅ Default user
    await seedDefaultUserAndLinkData();
    console.log('✅ Default user seeded + data linked.');

    // ✅ Sample data check
    const [rows] = await db.query("SELECT * FROM boards");

    if (rows.length === 0) {
      console.log("🌱 Seeding sample boards/lists/cards...");
      await seedData();
    } else {
      console.log("⚡ Sample data already exists");
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }

  // ✅ server start (ye already hai tumhare code me)
  app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    
    try {
      const connection = await db.getConnection();
      console.log('✅ Successfully connected to the MySQL database!');
      connection.release();
    } catch (error) {
      console.error('❌ Failed to connect to MySQL database:', error.message);
    }
  });
};

 



 
startServer();