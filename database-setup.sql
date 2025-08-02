-- Cricket Pro Ace Database Setup
-- Run this if you need to set up the database from scratch

-- Create database (if needed)
-- CREATE DATABASE cricproace;

-- Tables will be created automatically by Drizzle ORM when the server starts
-- This file is for reference only

-- Expected tables:
-- - users (id, username, email, password, display_name, points, created_at)
-- - tournaments (id, name, description, is_premium, created_at)
-- - matches (id, tournament_id, team1, team2, match_date, result, created_at)
-- - predictions (id, user_id, match_id, predicted_winner, points_awarded, created_at)
-- - tournament_user_access (id, tournament_id, user_id, created_at)

-- Default admin user will be created automatically:
-- Username: admin
-- Password: admin123
-- You can change this after first login