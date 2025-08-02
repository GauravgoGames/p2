# CricProAce - Sports Prediction Platform

## Overview
CricProAce is a comprehensive cricket prediction platform designed for tournament management, user predictions with leaderboards, admin verification, and real-time support. It aims to provide an engaging experience for cricket enthusiasts to predict match outcomes and compete with others. The platform is built as a full-stack monorepo, optimized for deployment on Replit.

## User Preferences
Preferred communication style: Simple, everyday language.

## Security Status
✅ **FULLY SECURED** - All security vulnerabilities resolved (August 2, 2025)
- Enterprise-grade security implementation with comprehensive protection
- See SECURITY_AUDIT.md for complete details of security measures implemented

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library, custom CSS variables for theming, responsive design utilities
- **Build Tool**: Vite
- **UI Components**: shadcn/ui component set built on Radix UI primitives
- **Features**: Tournament management, match predictions, user leaderboards, admin verification system, social engagement features (viewed by), percentage bar graphs for prediction visualization, embeddable widgets for WordPress.

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle ORM with TypeScript-first approach, Drizzle Kit for migrations
- **Session Management**: Express sessions with `connect-pg-simple`
- **Authentication**: Custom passport-local strategy with bcrypt hashing, account lockout, username impersonation protection
- **File Upload**: Multer for profile images and site assets
- **Real-time**: WebSocket support for live updates
- **Security**: Rate limiting, input validation and sanitization, CSRF token protection, security headers, password strength requirements, file upload restrictions, session security, null byte injection prevention.
- **Data Integrity**: Comprehensive backup/restore system, cascading deletions for data consistency.
- **Development Storage**: In-memory storage implementation (`MemStorage` class) for development.

### Shared Components
- **Schema**: Shared `User Model` and Zod validation schemas (`shared/schema.ts`) for type safety.
- **Storage Interface**: `IStorage` interface for CRUD operations.

### Deployment Strategy
- **Build Process**: Vite for frontend (`dist/public`), esbuild for backend (`dist/index.js`).
- **Production**: `npm run start` with `NODE_ENV=production`, runs on port 5000 (`0.0.0.0`), requires `DATABASE_URL`.
- **Health Checks**: Root health check endpoint (`/`), and additional endpoints (`/health`, `/api/health`).
- **Replit Configuration**: Uses `nodejs-20`, `web`, `postgresql-16` modules, autoscale deployment target, parallel execution with automatic port detection.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon Database
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management for React
- **wouter**: Lightweight client-side routing
- **express**: Web framework for Node.js
- **bcrypt**: For password hashing
- **multer**: For handling file uploads

### UI Dependencies
- **@radix-ui/***: Primitive UI components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant handling
- **clsx**: Conditional className utility

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundler for production server build
- **drizzle-kit**: For database migrations