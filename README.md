# CricProAce - Cricket Prediction Platform

A comprehensive cricket prediction platform built with React, TypeScript, and Node.js.

## Features

- User registration and authentication
- Tournament management
- Match predictions with confidence levels
- Real-time leaderboards
- Admin verification system
- Premium tournament access
- File upload for profiles and assets
- Enterprise-grade security features

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite (frontend), esbuild (backend)
- **Deployment**: Replit, cPanel compatible

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`
4. Push database schema:
   ```bash
   npm run db:push
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## Building for Production

### For Replit/Modern Hosting:
```bash
npm run build
npm start
```

### For cPanel/Traditional Hosting:
```bash
npm run build:cpanel
```
This creates a `cpanel-build/` folder with all necessary files for upload.

## Default Login

- Username: `admin`
- Password: `admin123456`

**Important**: Change the default password after first login.

## Security Features

- Password hashing with bcrypt
- Rate limiting and DDoS protection
- Input validation and sanitization
- CSRF protection
- Session security
- File upload restrictions
- SQL injection prevention

## Deployment

The application supports deployment on:
- Replit (primary platform)
- cPanel shared hosting
- VPS/dedicated servers

See deployment documentation for specific instructions.

## License

MIT License