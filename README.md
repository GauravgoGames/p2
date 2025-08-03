# Cricket Pro Ace - Complete Platform

A comprehensive cricket prediction platform with tournament management, user predictions, leaderboards, and admin controls.

## Features

### Core Features
- User authentication and registration
- Tournament creation and management
- Team management with editing capabilities
- Match creation and predictions
- Real-time leaderboards
- Points management system

### Advanced Features
- Premium tournament access
- View counter tracking
- Backup and restore functionality
- Real-time match updates
- Admin control panel
- Database management tools

### Recent Improvements
- Enhanced team editing functionality
- Improved points management
- Premium tournament user selections
- View counter implementation
- Backup/restore capabilities
- Match update features
- Security enhancements

## Installation

### For cPanel Hosting

1. Upload all files to your cPanel directory
2. SSH into your server and navigate to the directory
3. Copy `.env.example` to `.env` and update database credentials
4. Run: `./deploy-cpanel.sh`

### For Development

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Run: `npm install`
4. Run: `npm run dev`

## Database Setup

The application uses PostgreSQL with Drizzle ORM. Tables are created automatically on first run.

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Strong secret for session encryption
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)

## API Endpoints

- `/api/health` - Server health check
- `/api/user` - User management
- `/api/tournaments` - Tournament operations
- `/api/matches` - Match management
- `/api/predictions` - User predictions
- `/api/leaderboard` - Rankings and scores

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite for frontend, esbuild for backend
- **Deployment**: PM2 for process management

This is the complete, production-ready cricket prediction platform.
