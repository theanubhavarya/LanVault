CREATE DATABASE IF NOT EXISTS lanvault;
USE lanvault;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scholar_number VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(50) DEFAULT 'Anonymous',
    college VARCHAR(100) DEFAULT 'Unknown',
    branch VARCHAR(100) DEFAULT 'Unknown',
    pin VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    user_id INT,
    mode VARCHAR(20) DEFAULT 'offline', -- 🆕 This is the crucial missing piece
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);