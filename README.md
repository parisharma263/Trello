# 🏄‍♂️ Trello Clone

A full-stack, fully functional Kanban-style task management board inspired by Trello. Built with a modern React frontend and a robust Node.js/Express backend powered by MySQL.

This project was built emphasizing clean, minimalistic modern UI, utilizing fluid animations, cross-column drag-and-drop capabilities, and instantaneous optimistic UI rendering.

---



## ✨ Features

- **Dynamic Kanban Lists**: Add, delete, and organize categorical lists seamlessly.
- **Card Management**: Create tasks, set detailed descriptions, and assign specific due dates directly from intuitive popup modals.
- **Drag & Drop Engine**: Features a highly integrated `@dnd-kit/core` layout allowing fluid re-ordering of tasks internally, and cross-column transferring natively updating database structures.
- **Instantaneous Search**: Natively filter out tasks dynamically locally without hammering the database.
- **Optimistic UI Engine**: All operations update visually upon interaction instantaneously before database syncing cleanly hiding latency.
- **Professional Styling**: Pure Vanilla CSS featuring glassmorphism, native cubic-bezier transitions, modern `<input>` tracking, popping `box-shadows`, and Google's beautiful `Poppins` & `Inter` font stacks.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React (Vite)
- **Styling:** Custom Vanilla CSS (Modern layouts, Flexbox, Keyframes)
- **Data Fetching:** Axios
- **Drag and Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Driver:** `mysql2/promise` (Using efficient DB connection pooling)
- **Configuration:** `dotenv`, `cors`

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v16+)
- MySQL Server (v8+)

### 1. Database Configuration
1. Open your local MySQL server.
2. Formally execute the SQL generation commands logically sitting inside `backend/schema.sql` to generate the `trello_clone` database, tables, and relational dependencies natively.
3. Apply default Seed Data located firmly at the bottom of the SQL script explicitly testing your setup.

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies naturally:
   ```bash
   npm install
   ```
3. Create a `.env` file referencing your local MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=trello_clone
   PORT=5000
   ```
4. Start your Express Server gracefully:
   ```bash
   node index.js
   ```

### 3. Frontend Setup
1. Open a **new** terminal inherently navigating into the frontend directory cleanly:
   ```bash
   cd frontend
   ```
2. Install node dependencies explicitly:
   ```bash
   npm install
   ```
3. Initialize Vite's lightning-fast development engine cleanly:
   ```bash
   npm run dev
   ```
4. Open the localhost URL natively output to the console!

---

## 📡 Core API Endpoints

### Boards & Lists
- `GET /boards` - Retrieve globally available boards.
- `GET /boards/:id/lists` - Retrieve all lists (and nested cards natively cascaded) belonging to a specific board explicitly.
- `POST /lists` - Create a brand new categorically structured list manually.
- `DELETE /lists/:id` - Irreversibly drop an exact list (deletes matching nested cards simultaneously via SQL cascades securely).

### Cards
- `POST /cards` - Appends a generic clean task structurally onto a list securely.
- `PUT /cards/:id` - Mutate explicit Card titles natively, modify descriptions, and attach due dates cleanly.
- `DELETE /cards/:id` - Explicitly remove a card cleanly natively via ID securely.

### Movement
- `PUT /cards/:id/move` - Modulates list identifiers physically saving your Drag-And-Drop layouts natively explicitly securely.

---

## 🤝 Contribution
Contributions, issues, and feature requests genuinely welcome. Feel completely free to explicitly fork securely and craft natively gracefully explicitly!
