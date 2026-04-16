const express = require('express');
const cors = require('cors');
const db = require('./db');

const bcrypt = require('bcrypt');
const seedData = require('./seed');

const app = express();
const PORT = 5000;

let dbAvailable = true;

app.use(cors());
app.use(express.json());

// Default user
const DEFAULT_USER = {
  username: 'user',
  email: 'user@gmail.com',
  password: 'user123',
};

// ================== DEFAULT USER ==================

async function seedDefaultUserIfMissing() {
  const [existing] = await db.query(
    'SELECT id FROM users WHERE email = ?',
    [DEFAULT_USER.email]
  );

  if (existing.length > 0) return existing[0].id;

  const hashedPassword = await bcrypt.hash(DEFAULT_USER.password, 10);

  const [result] = await db.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [DEFAULT_USER.username, DEFAULT_USER.email, hashedPassword]
  );

  return result.insertId;
}

async function seedDefaultUserAndLinkData() {
  return await seedDefaultUserIfMissing();
}

// ================== ROUTES ==================

app.get('/', (req, res) => {
  res.send('Server running 🚀');
});

// DEFAULT LOGIN
app.get('/auth/default-login', async (req, res) => {
  try {
    if (!dbAvailable) {
      return res.json({
        id: 1,
        email: "demo@test.com",
        name: "Demo User"
      });
    }

    const userId = await seedDefaultUserAndLinkData();

    const [users] = await db.query(
      'SELECT id, email, username FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      id: users[0].id,
      email: users[0].email,
      name: users[0].username,
    });

  } catch (err) {
    res.json({
      id: 1,
      email: "demo@test.com",
      name: "Demo User"
    });
  }
});

// ================== BOARDS ==================

app.get('/boards', async (req, res) => {
  try {
    if (!dbAvailable) {
      return res.json([
        { id: 1, title: "Demo Board 1" },
        { id: 2, title: "Demo Board 2" }
      ]);
    }

    const [boards] = await db.query('SELECT * FROM boards');
    res.json(boards);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// ================== LISTS + CARDS ==================

app.get('/boards/:id/lists', async (req, res) => {
  try {

    // DEMO MODE
    if (!dbAvailable) {
      return res.json([
        {
          id: 1,
          title: "To Do",
          cards: [
            {
              id: 1,
              title: "Demo Task 1",
              description: "This is demo data"
            }
          ]
        },
        {
          id: 2,
          title: "Done",
          cards: [
            {
              id: 2,
              title: "Demo Task 2",
              description: "Completed task"
            }
          ]
        }
      ]);
    }

    const boardId = req.params.id;

    const [lists] = await db.query(
      'SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC',
      [boardId]
    );

    const listsWithCards = await Promise.all(
      lists.map(async (list) => {
        const [cards] = await db.query(
          'SELECT * FROM cards WHERE list_id = ? ORDER BY position ASC',
          [list.id]
        );

        return { ...list, cards };
      })
    );

    res.json(listsWithCards);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// ================== START SERVER ==================

const startServer = async () => {
  try {
    await seedDefaultUserAndLinkData();

    const [rows] = await db.query("SELECT * FROM boards");

    if (rows.length === 0) {
      await seedData();
    }

  } catch (err) {
    console.log("⚠️ DEMO MODE ACTIVE");
    dbAvailable = false;
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
