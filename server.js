// Simple Express server for cPanel deployment
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.static(__dirname));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'cricproace' });
});

// Basic API endpoints (expand these with your actual implementation)
app.get('/api/user', (req, res) => {
  res.status(401).json({ message: 'Authentication required' });
});

app.get('/api/tournaments', (req, res) => {
  res.json([]);
});

app.get('/api/matches', (req, res) => {
  res.json([]);
});

app.get('/api/leaderboard', (req, res) => {
  res.json([]);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CricProAce server running on port ${PORT}`);
});