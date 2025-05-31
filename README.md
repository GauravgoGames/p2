# P2 - ProAce Predictions Platform

Complete cricket prediction platform with advanced tournament management and user analytics.

## Latest Updates
- Mobile-responsive navigation with complete menu items
- Performance charts optimized for mobile devices  
- Header navigation with MainSite integration
- Footer enhanced with external links
- Tournament interface improvements
- Complete mobile/tablet responsiveness

## Quick Start

### Local Development
```bash
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:push
npm run dev
```

### Production Deployment (cPanel)
```bash
npm install
npm run build
npm run db:push
pm2 start dist/index.js --name proace-predictions
```

## Project Structure
- `client/` - React frontend application
- `server/` - Node.js backend API
- `shared/` - Shared types and database schemas
- `public/` - Static assets and file uploads
- Various deployment packages for different hosting scenarios

## Features
- User authentication and profile management
- Cricket match predictions with points system
- Tournament management and analysis
- Real-time leaderboards with interactive charts
- Admin dashboard for comprehensive management
- Mobile-responsive design for all devices
- File upload system for logos and profiles

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + Passport.js
- Database: PostgreSQL with Drizzle ORM
- Charts: Recharts for data visualization
- Process Management: PM2 for production

## Deployment Packages
The repository includes multiple deployment configurations:
- `cpanel-package/` - cPanel-specific deployment
- `deployment/` - General deployment scripts
- `enhanced-package/` - Enhanced features package
- `fresh_cpanel_package/` - Latest cPanel deployment

Choose the appropriate package based on your hosting environment.
