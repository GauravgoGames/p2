-- CricProAce MySQL Database Schema
-- Use this for cPanel MySQL setup

CREATE DATABASE IF NOT EXISTS cricproace;
USE cricproace;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    displayName VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('user', 'admin') DEFAULT 'user',
    profileImage VARCHAR(255),
    bio TEXT,
    isVerified BOOLEAN DEFAULT FALSE,
    totalPoints INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tournaments table
CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    startDate DATETIME,
    endDate DATETIME,
    isActive BOOLEAN DEFAULT TRUE,
    isPremium BOOLEAN DEFAULT FALSE,
    image VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournamentId INT NOT NULL,
    team1Id INT NOT NULL,
    team2Id INT NOT NULL,
    scheduledDate DATETIME NOT NULL,
    status ENUM('upcoming', 'live', 'completed', 'cancelled') DEFAULT 'upcoming',
    result ENUM('team1', 'team2', 'draw') DEFAULT NULL,
    team1Score VARCHAR(50),
    team2Score VARCHAR(50),
    venue VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tournamentId) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team1Id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (team2Id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Predictions table
CREATE TABLE predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    matchId INT NOT NULL,
    prediction ENUM('team1', 'team2', 'draw') NOT NULL,
    confidence INT DEFAULT 50,
    points INT DEFAULT 0,
    isCorrect BOOLEAN DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_match (userId, matchId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
);

-- Sample data
-- Default admin user (password: admin123456)
INSERT INTO users (username, displayName, password, role) VALUES 
('admin', 'Administrator', '$2b$12$hBoUlTf3ZmIX3dOHI/uHRuNpGIR9DwwbLVQ.q9QJFq1VK5mFTiVKa', 'admin');

-- Sample teams
INSERT INTO teams (name) VALUES 
('India'), ('Australia'), ('England'), ('Pakistan');

-- Sample tournament
INSERT INTO tournaments (name, description, isActive, isPremium) VALUES 
('Proace Championship', 'Cricket prediction tournament', TRUE, TRUE);

-- Sample match
INSERT INTO matches (tournamentId, team1Id, team2Id, scheduledDate, status) VALUES 
(1, 1, 2, '2025-08-15 14:30:00', 'upcoming');