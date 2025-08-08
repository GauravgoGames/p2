# CricProAce - Sports Prediction Platform

A comprehensive cricket prediction platform with tournament management, user verification system, and support ticket functionality.

## Features
- Advanced tournament and match management
- User prediction system with points and leaderboards
- Admin verification system with badges
- Support ticket system with real-time chat
- Mobile-responsive design
- PostgreSQL database integration

## Technology Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom session-based auth
- **UI Components**: Shadcn/ui + Radix UI

## Quick Start

### For cPanel Hosting:

1. Upload all files to your cPanel file manager
2. Install Node.js via cPanel (if available) or contact hosting provider
3. Set up PostgreSQL database in cPanel
4. Configure environment variables in `.env` file
5. Run deployment script:
   ```bash
   chmod +x cpanel-deploy.sh
   ./cpanel-deploy.sh
   ```

### Environment Setup:
1. Copy `.env.example` to `.env`
2. Update database credentials
3. Set a secure SESSION_SECRET
4. Configure your domain settings

### Database Setup:
The application will automatically create required tables on first run.

## Admin Access
Default admin credentials:
- Username: admin
- Password: admin123

**Important**: Change admin password immediately after first login!

## Support
For technical support, please refer to the documentation or contact the development team.
