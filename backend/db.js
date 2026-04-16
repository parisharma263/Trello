const mysql = require('mysql2/promise')
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // Aiven ke liye ye line compulsory hai
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection fail ho gaya:', err.message);
  } else {
    console.log('Success! Cloud MySQL se connect ho gaye.');
    connection.release();
  }
});

module.exports = pool;
