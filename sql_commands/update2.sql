-- Drop labvault database
DROP DATABASE IF EXISTS labvault;

-- Create the brand new database
CREATE DATABASE IF NOT EXISTS lanvault;
USE lanvault;

-- Create the Users table with the new PIN column
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scholar_number VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(50) DEFAULT 'Anonymous',
    college VARCHAR(100) DEFAULT 'Unknown',
    branch VARCHAR(100) DEFAULT 'Unknown',
    pin VARCHAR(255) NOT NULL, -- 🆕 The new hashed PIN column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate the Files table 
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    user_id INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);