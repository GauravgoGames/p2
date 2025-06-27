# CricProAce - Sports Prediction Platform

## Overview

This is a comprehensive cricket prediction platform with tournament management, user verification system, and support ticket functionality. Built with React, TypeScript, Express.js, and PostgreSQL, it features advanced tournament management, user prediction systems with leaderboards, admin verification with badges, and real-time support chat. The application is structured as a full-stack monorepo designed for deployment on Replit.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds
- **UI Components**: Comprehensive shadcn/ui component library with Radix UI primitives
- **Features**: Tournament management, match predictions, user leaderboards, admin verification system

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with connect-pg-simple
- **Authentication**: Custom passport-local strategy with bcrypt hashing
- **File Upload**: Multer for profile images and site assets
- **Real-time**: WebSocket support for live updates

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle ORM with TypeScript-first approach
- **Schema Location**: `shared/schema.ts` for type safety across client/server
- **Migrations**: Drizzle Kit for database migrations in `./migrations`
- **Development Storage**: In-memory storage implementation for development (MemStorage class)

## Key Components

### Shared Schema
- **User Model**: Basic user schema with id, username, and password fields
- **Type Safety**: Zod validation schemas generated from Drizzle schema
- **Location**: `shared/schema.ts` - accessible by both client and server

### Storage Interface
- **Interface**: `IStorage` defines CRUD operations
- **Implementation**: `MemStorage` class for in-memory development storage
- **Methods**: `getUser`, `getUserByUsername`, `createUser`
- **Location**: `server/storage.ts`

### Client-Side Components
- **Pages**: Home page with modern Hello World design, 404 Not Found page
- **UI Library**: Complete shadcn/ui component set (50+ components)
- **Styling**: Custom CSS variables for theming, responsive design utilities
- **Hooks**: Custom hooks for mobile detection and toast notifications

### Server-Side Setup
- **Route Registration**: Modular route system in `server/routes.ts`
- **Development Server**: Vite integration for hot module replacement
- **Static Serving**: Production-ready static file serving
- **Error Handling**: Centralized error handling middleware
- **Logging**: Request/response logging with timing information

## Data Flow

1. **Client Requests**: React components make API calls using React Query
2. **API Routes**: Express.js routes handle requests with `/api` prefix
3. **Storage Layer**: Routes interact with storage interface for data operations
4. **Database Operations**: Drizzle ORM handles database queries (when configured)
5. **Response**: JSON responses sent back to client with proper error handling
6. **State Management**: React Query manages client-side caching and synchronization

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon Database
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management for React
- **wouter**: Lightweight client-side routing

### UI Dependencies
- **@radix-ui/***: Primitive UI components (30+ packages)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant handling
- **clsx**: Conditional className utility

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundler for production server build

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Static Assets**: Frontend assets served from `dist/public`

### Production Configuration
- **Start Command**: `npm run start` runs production server
- **Environment**: NODE_ENV=production
- **Port**: Application runs on port 5000 (mapped to external port 80)
- **Database**: Requires DATABASE_URL environment variable for PostgreSQL connection

### Development Configuration
- **Dev Command**: `npm run dev` runs development server with hot reload
- **Vite Integration**: Full HMR support for frontend development
- **TypeScript**: Real-time type checking across the entire stack

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Deployment**: Autoscale deployment target
- **Workflows**: Parallel execution with automatic port detection

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 27, 2025. Initial setup
- June 27, 2025. Implemented security code password reset functionality with native HTML inputs for full editability
- June 27, 2025. Fixed admin password reset bugs and restored default admin credentials (admin/admin123)
- June 27, 2025. Fixed critical admin user verification issue - admin user now created as verified by default during database initialization
- June 27, 2025. Completed social engagement features implementation - added "Loved By" and "Viewed By" metrics with interactive buttons and automatic tracking across all user profiles and dashboards
- June 27, 2025. Enhanced social engagement features - added interactive love and view buttons to leaderboard page with real-time counter updates, automatic view tracking when clicking usernames/eye buttons, and proper visual feedback with red heart fills when loved
- June 27, 2025. Fixed negative love counter bug by implementing GREATEST function in SQL to prevent counts below zero, reset all negative counters to 0, and completed comprehensive followers section in user profiles showing all users who love the current user with verification badges and clickable profiles
- June 27, 2025. Added "Match" label on match winner teams (green badge on left side) similar to existing "Toss" label (yellow badge on right side) for better visual identification of match winners
- June 27, 2025. Enhanced Tournament Analysis page slider with intuitive navigation controls - added "Less" and "More" buttons with chevron icons for easy left-right data navigation, clear match count display, and automatic button disabling at limits
- June 27, 2025. Fixed critical Tournament Analysis page database query error (invalid input syntax for type integer) by refactoring SQL query to use individual match ID queries instead of problematic IN clause
- June 27, 2025. Reverted Tournament Analysis page to original design and added support for up to 200 matches (horizontal slider) and 200 users (vertical slider) with smooth 5-step increments
- June 27, 2025. Replaced Tournament Analysis page sliders with button controls after user feedback about slider responsiveness issues - now uses +1/+5/+10 increment buttons and quick access buttons (10/25/50/100/All) for both matches and users
- June 27, 2025. Replaced meter visualization in match cards with percentage bar graphs showing poll-style voting results for toss and match predictions - implemented horizontal bars with gradient colors (yellow/orange for toss, blue/green for match) displaying percentages inside the bars
- June 27, 2025. Added WordPress integration features - created embeddable widgets for live match predictions and leaderboard that can be integrated into any WordPress site via iframe, shortcode, widget, or Gutenberg block, with comprehensive documentation in WORDPRESS_INTEGRATION.md
- June 27, 2025. Updated leaderboard ranking logic with three-tier criteria: 1) Points (higher is better), 2) Success ratio (higher is better), 3) Total match participation (higher is better) - ensuring fair and comprehensive ranking system
- June 27, 2025. Removed "Powered by CricProAce" branding from embedded widgets/iframes for cleaner integration into external websites
- June 27, 2025. Implemented comprehensive security features to protect against DDoS, SQL injection, and fraud:
  - Rate limiting (100 requests/15min general, 5 attempts/15min for auth)
  - Account lockout after 5 failed login attempts (30 minute lockout)
  - Input validation and sanitization for all user inputs
  - CSRF token protection for state-changing operations
  - Security headers (CSP, X-Frame-Options, X-XSS-Protection)
  - Password strength requirements (8+ chars, upper/lower/numbers)
  - File upload restrictions (5MB max, image types only)
  - Session security with HTTP-only cookies
  - MongoDB injection protection and parameter pollution prevention
- June 28, 2025. Fixed match card layout issues - reduced excessive white space, optimized padding throughout card sections, added proper truncation for long location names with title tooltips, reduced team logo sizes from 20x20 to 16x16 for better visual balance