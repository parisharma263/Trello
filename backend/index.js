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

// ================= DEFAULT USER =================

const DEFAULT_USER = {
  username: 'user',
  email: 'user@gmail.com',
  password: 'user123',
};

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

// ================= ROUTES =================

// health
app.get('/', (req, res) => {
  res.send('Server running 🚀');
});

// ✅ DEFAULT LOGIN
app.get('/auth/default-login', async (req, res) => {
  try {
    if (!dbAvailable) {
      return res.json({
        id: 1,
        email: "user@gmail.com",
        name: "Demo User"
      });
    }

    const userId = await seedDefaultUserIfMissing();

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
      email: "user@gmail.com",
      name: "Demo User"
    });
  }
});

// ================= BOARDS =================

app.get('/boards', async (req, res) => {
  try {
    if (!dbAvailable) {
      return res.json([
        { id: 1, title: "Demo Project Board" }
      ]);
    }

    const [boards] = await db.query('SELECT * FROM boards');
    res.json(boards);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// ================= LISTS + CARDS =================

app.get('/boards/:id/lists', async (req, res) => {
  try {

    // 🔥 DEMO DATA (NO DB)
    if (!dbAvailable) {
      return res.json([
        {
          id: 1,
          title: "To Do",
          cards: [
            { id: 1, title: "Design UI", description: "Landing page design" },
            { id: 2, title: "Setup backend", description: "Express setup" },
            { id: 3, title: "API connect", description: "Frontend integration" }
          ]
        },
        {
          id: 2,
          title: "In Progress",
          cards: [
            { id: 4, title: "Drag & Drop", description: "Implement feature" },
            { id: 5, title: "Checklist", description: "Add checklist UI" }
          ]
        },
        {
          id: 3,
          title: "Done",
          cards: [
            { id: 6, title: "Project setup", description: "Initial structure" },
            { id: 7, title: "Routing", description: "React routing done" }
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

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    
    try {
        // Force fully database check karega, agar fail hua toh log mein dikhega
        await seedDefaultUserIfMissing();
        
        const [rows] = await db.query("SELECT * FROM boards");
        if (rows.length === 0) {
            await seedData();
            console.log("🌱 Database seeded with initial data!");
        }
        
        console.log("✅ Database connected and ready!");
    } catch (err) {
        console.error("❌ Database Error:", err.message);
        // Ab agar connection fail hua, toh Render logs mein saaf dikhega kyun hua
    }
});
