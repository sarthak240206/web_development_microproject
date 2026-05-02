CREATE DATABASE IF NOT EXISTS bookverse_db;
USE bookverse_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_key VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) DEFAULT 'Unknown',
  publish_year VARCHAR(30) DEFAULT 'N/A',
  cover_id VARCHAR(60) DEFAULT '',
  edition_count VARCHAR(30) DEFAULT 'N/A',
  languages_json TEXT,
  subjects_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_book (user_id, book_key),
  CONSTRAINT fk_user_favorites FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
