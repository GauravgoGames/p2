# 🏏 Cricket Pro Ace - Complete Platform

**Ready-to-deploy cricket prediction platform for cPanel hosting**

## Features
- ✅ Tournament Management
- ✅ Team Creation & Editing  
- ✅ Match Predictions
- ✅ User Leaderboards
- ✅ Points Management System
- ✅ Premium Tournament Access
- ✅ View Counter Tracking
- ✅ Backup & Restore Tools
- ✅ Real-time Match Updates
- ✅ Admin Control Panel

## Quick Installation

### 1. Upload to cPanel
Upload all files to your domain directory (e.g., `expertlive.pro-ace-predictions.co.uk`)

### 2. Deploy
```bash
chmod +x deploy-cpanel.sh
./deploy-cpanel.sh
```

### 3. Done!
Your cricket prediction platform is now live.

## Manual Installation

### Install Dependencies
```bash
npm install
```

### Setup Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### Start Server
```bash
npm run dev
```

## Database Setup

The application uses PostgreSQL with Drizzle ORM. Tables are created automatically on first run.

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Strong secret for session encryption
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode

## Default Login
- **Username:** admin
- **Password:** admin123

## Technology Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript  
- **Database:** PostgreSQL with Drizzle ORM
- **Build:** Vite for frontend, tsx for backend
- **Process Management:** PM2

## Support
This is a complete, production-ready cricket prediction platform.