-- PostgreSQL Database Schema for ProAce Predictions

-- User roles enum
CREATE TYPE "user_role" AS ENUM ('user', 'admin');

-- Match status enum
CREATE TYPE "match_status" AS ENUM ('upcoming', 'ongoing', 'completed');

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "display_name" TEXT,
  "email" TEXT,
  "profile_image" TEXT,
  "role" user_role NOT NULL DEFAULT 'user',
  "points" INTEGER NOT NULL DEFAULT 0
);

-- Teams table
CREATE TABLE IF NOT EXISTS "teams" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "logo_url" VARCHAR(255),
  "is_custom" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Matches table
CREATE TABLE IF NOT EXISTS "matches" (
  "id" SERIAL PRIMARY KEY,
  "tournament_name" TEXT NOT NULL,
  "team1_id" INTEGER NOT NULL,
  "team2_id" INTEGER NOT NULL,
  "location" TEXT NOT NULL,
  "match_date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "status" match_status NOT NULL DEFAULT 'upcoming',
  "toss_winner_id" INTEGER,
  "match_winner_id" INTEGER,
  "team1_score" TEXT,
  "team2_score" TEXT,
  "result_summary" TEXT
);

-- Predictions table
CREATE TABLE IF NOT EXISTS "predictions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "match_id" INTEGER NOT NULL REFERENCES "matches"("id"),
  "predicted_toss_winner_id" INTEGER,
  "predicted_match_winner_id" INTEGER,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "points_earned" INTEGER DEFAULT 0,
  UNIQUE ("user_id", "match_id")
);

-- Points ledger table
CREATE TABLE IF NOT EXISTS "points_ledger" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "match_id" INTEGER REFERENCES "matches"("id"),
  "points" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Site settings table
CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" VARCHAR NOT NULL PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);

-- Create admin user (password is "admin123")
INSERT INTO "users" ("username", "email", "password", "display_name", "role", "points")
VALUES ('admin', 'admin@example.com', '$2a$10$zQE3YwqMj9tzzOLV25CzJ.7Qh3lhzDNB9qYX2PvQfbWdIw6eBQGCe', 'Admin User', 'admin', 10)
ON CONFLICT (username) DO NOTHING;

-- Create default site settings
INSERT INTO "site_settings" ("key", "value")
VALUES 
  ('siteName', 'ProAce Predictions'),
  ('siteLogo', '/uploads/site/default-logo.svg'),
  ('pointsForToss', '1'),
  ('pointsForMatch', '1')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_predictions_user" ON "predictions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_predictions_match" ON "predictions" ("match_id");
CREATE INDEX IF NOT EXISTS "idx_matches_status" ON "matches" ("status");
CREATE INDEX IF NOT EXISTS "idx_points_ledger_user" ON "points_ledger" ("user_id");