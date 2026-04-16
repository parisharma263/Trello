const db = require('./db');

async function seedData() {
  try {
    // Create board
    const [board] = await db.query(
      "INSERT INTO boards (title) VALUES ('Demo Project')"
    );

    const boardId = board.insertId;

    // Create lists
    const [todo] = await db.query(
      "INSERT INTO lists (title, board_id, position) VALUES ('To Do', ?, 1)",
      [boardId]
    );

    const [doing] = await db.query(
      "INSERT INTO lists (title, board_id, position) VALUES ('Doing', ?, 2)",
      [boardId]
    );

    const [done] = await db.query(
      "INSERT INTO lists (title, board_id, position) VALUES ('Done', ?, 3)",
      [boardId]
    );

    // Create cards
    await db.query(
      "INSERT INTO cards (title, description, list_id) VALUES (?, ?, ?)",
      ["Setup Project", "Initialize backend and frontend", todo.insertId]
    );

    await db.query(
      "INSERT INTO cards (title, description, list_id) VALUES (?, ?, ?)",
      ["Build UI", "Design Trello layout", doing.insertId]
    );

    await db.query(
      "INSERT INTO cards (title, description, list_id) VALUES (?, ?, ?)",
      ["Deploy App", "Deploy on Vercel/Render", done.insertId]
    );

    console.log("✅ Sample data inserted");
  } catch (err) {
    console.log("Seed error:", err);
  }
}

module.exports = seedData;