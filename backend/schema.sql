-- 1. users Table: Stores user accounts
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. boards Table: The main project workspaces
CREATE TABLE boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    owner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. lists Table: The columns within a board (e.g., "To Do", "Done")
CREATE TABLE lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT,
    title VARCHAR(255) NOT NULL,
    position INT NOT NULL, -- Used to order lists on the board
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- 4. cards Table: The individual tasks within a list
CREATE TABLE cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    list_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    position INT NOT NULL, -- Used to order cards within a list
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- 5. card_members Table: Many-to-many relationship assigning users to cards
CREATE TABLE card_members (
    card_id INT,
    user_id INT,
    PRIMARY KEY (card_id, user_id),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. labels Table: Tags that can be created per board
CREATE TABLE labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex code, e.g., '#FF0000'
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- 7. card_labels Table: Many-to-many relationship assigning labels to cards
CREATE TABLE card_labels (
    card_id INT,
    label_id INT,
    PRIMARY KEY (card_id, label_id),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- 8. checklist_items Table: Subtasks within a single card
CREATE TABLE checklist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT,
    content VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert a sample user
INSERT INTO users (username, email, password_hash)
VALUES ('john_doe', 'john@example.com', 'hashedpassword123');

-- Insert a sample board owned by John
INSERT INTO boards (title, owner_id)
VALUES ('Web App Launch', 1);

-- Insert lists into the board
INSERT INTO lists (board_id, title, position) VALUES
(1, 'To Do', 1),
(1, 'In Progress', 2),
(1, 'Done', 3);

-- Insert cards into the lists
-- Cards for "To Do" (list_id 1)
INSERT INTO cards (list_id, title, description, position) VALUES
(1, 'Design database schema', 'Create MySQL tables for the new app', 1),
(1, 'Setup React frontend', 'Initialize Vite app and add Tailwind', 2);

-- Card for "In Progress" (list_id 2)
INSERT INTO cards (list_id, title, description, position) VALUES
(2, 'Create authentication API', 'Implement JWT login endpoint', 1);

-- Assign user (John) to some cards
INSERT INTO card_members (card_id, user_id) VALUES
(1, 1),
(3, 1);

-- Create some labels for the board
INSERT INTO labels (board_id, name, color) VALUES
(1, 'Backend', '#ff9f1a'),
(1, 'Frontend', '#0079bf'),
(1, 'Urgent', '#eb5a46');

-- Apply labels to cards
INSERT INTO card_labels (card_id, label_id) VALUES
(1, 1), -- Database Schema -> Backend
(2, 2), -- Setup React -> Frontend
(3, 1), -- Auth API -> Backend
(3, 3); -- Auth API -> Urgent

-- Add checklists to the Database Schema card (card_id 1)
INSERT INTO checklist_items (card_id, content, position, is_completed) VALUES
(1, 'Write CREATE TABLE statements', 1, TRUE),
(1, 'Add foreign key associations', 2, TRUE),
(1, 'Write sample Seed Data', 3, FALSE);
