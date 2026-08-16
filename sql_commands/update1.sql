USE labvault;

-- 1. Clear the old test tables
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS users;

-- 2. Create the new and improved Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scholar_number VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(50) DEFAULT 'Anonymous',
    college VARCHAR(100) DEFAULT 'Unknown',
    branch VARCHAR(100) DEFAULT 'Unknown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Recreate the Files table 
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