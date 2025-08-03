# CricProAce - Cricket Prediction Platform

A comprehensive cricket prediction platform built with React, Node.js, and PostgreSQL.

## Features

- 🏏 Cricket match predictions
- 👥 User registration and authentication  
- 🏆 Tournament management
- 📊 Leaderboards and points system
- 👨‍💼 Admin panel for match management
- 🎯 Toss and match winner predictions
- 📱 Responsive design
- 🔒 Secure user sessions

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- Wouter for routing
- React Query for state management
- Vite for building

### Backend  
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- Passport.js authentication
- WebSocket support
- Session management

### Deployment
- Optimized for cPanel hosting
- PM2 process management
- Production builds with esbuild

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Database Setup
```bash
npm run db:push
```

## Environment Variables

```env
NODE_ENV=production
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=your_session_secret
PORT=5000
HOST=0.0.0.0
```

## Project Structure

```
├── client/src/          # React frontend
├── server/              # Node.js backend  
├── shared/              # Shared types and schemas
├── dist/                # Built files (generated)
└── uploads/             # User uploaded files
```

## Deployment

See `GITHUB-UPDATE-INSTRUCTIONS.md` for complete deployment guide to cPanel hosting.

## License

MIT License