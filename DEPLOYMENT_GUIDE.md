# CricProAce Deployment Guide for cPanel

## Overview
This guide provides step-by-step instructions to deploy the CricProAce application on cPanel, updating from an older version to the latest version.

## Prerequisites
- cPanel access with Terminal/SSH access
- PostgreSQL database access
- Node.js support on your hosting (Node.js 18+ recommended)
- Git installed on the server

## Step 1: Backup Current Installation

Before updating, create a backup of your current installation:

```bash
# Navigate to your home directory
cd ~

# Create backup directory
mkdir -p backups/cricproace-$(date +%Y%m%d)

# Backup current installation
cp -r public_html/cricproace backups/cricproace-$(date +%Y%m%d)/

# Backup database (replace with your database details)
pg_dump -U your_db_user -h localhost your_db_name > backups/cricproace-$(date +%Y%m%d)/database_backup.sql
```

## Step 2: Clone/Update from GitHub

```bash
# Navigate to your public_html directory
cd ~/public_html

# If this is a fresh installation:
git clone https://github.com/yourusername/cricproace.git cricproace-new

# If updating existing repository:
cd cricproace
git fetch origin
git pull origin main
```

## Step 3: Database Setup

### For Fresh Installation:

1. Create a new PostgreSQL database in cPanel
2. Note down the database credentials:
   - Database name
   - Username
   - Password
   - Host (usually localhost)

3. Run the initial database setup:

```bash
# Navigate to project directory
cd ~/public_html/cricproace

# Create .env file
cp .env.example .env

# Edit .env file with your database credentials
nano .env
```

Add the following to your .env file:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PGHOST=localhost
PGPORT=5432
PGDATABASE=database_name
PGUSER=username
PGPASSWORD=password
NODE_ENV=production
SESSION_SECRET=your-random-session-secret-here
```

### For Updating Existing Installation:

```bash
# Navigate to project directory
cd ~/public_html/cricproace

# Copy existing .env file from backup
cp ../cricproace-old/.env .env

# Run database migrations
npm run db:push
```

## Step 4: Install Dependencies

```bash
# Ensure you're in the project directory
cd ~/public_html/cricproace

# Install Node.js dependencies
npm install --production

# Build the application
npm run build
```

## Step 5: Configure cPanel Node.js Application

1. In cPanel, go to "Setup Node.js App"
2. Create a new application or update existing:
   - Node.js version: 18.x or higher
   - Application mode: Production
   - Application root: /home/username/public_html/cricproace
   - Application URL: cricproace (or your subdomain)
   - Application startup file: dist/index.js

3. Click "Create" or "Save"

## Step 6: Environment Variables in cPanel

1. In the Node.js application settings, click "Edit"
2. Add environment variables:
   - DATABASE_URL
   - PGHOST
   - PGPORT
   - PGDATABASE
   - PGUSER
   - PGPASSWORD
   - NODE_ENV=production
   - SESSION_SECRET

3. Save the configuration

## Step 7: Set Up .htaccess for Apache

Create/update `.htaccess` in your application directory:

```bash
nano ~/public_html/cricproace/.htaccess
```

Add the following content:
```apache
DirectoryIndex disabled
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:YOUR_NODE_PORT/$1 [P,L]
```

Replace `YOUR_NODE_PORT` with the port assigned by cPanel for your Node.js app.

## Step 8: Start/Restart the Application

1. In cPanel Node.js settings, click "Run NPM Install" if needed
2. Click "Restart" to start the application

## Step 9: Verify Installation

1. Visit your website URL
2. Default admin credentials:
   - Username: admin
   - Password: admin123

3. **IMPORTANT**: Change the admin password immediately after first login

## Step 10: Post-Deployment Tasks

1. Test all major features:
   - User registration/login
   - Tournament creation
   - Match predictions
   - Leaderboard functionality
   - Admin panel

2. Set up SSL certificate if not already configured

3. Configure any necessary firewall rules for security

## Troubleshooting

### Common Issues:

1. **500 Internal Server Error**
   - Check error logs in cPanel
   - Verify .htaccess configuration
   - Ensure Node.js app is running

2. **Database Connection Error**
   - Verify database credentials in .env
   - Check if PostgreSQL service is running
   - Ensure database user has proper permissions

3. **Missing Dependencies**
   - Run `npm install` again
   - Check Node.js version compatibility

### Logs Location:
- Application logs: `~/public_html/cricproace/logs/`
- cPanel error logs: Check cPanel's error log viewer

## Maintenance

### Regular Updates:
```bash
cd ~/public_html/cricproace
git pull origin main
npm install
npm run build
# Restart Node.js app in cPanel
```

### Database Backups:
Set up automated daily backups in cPanel for both files and database.

## Security Considerations

1. Change default admin password immediately
2. Set up proper file permissions:
   ```bash
   find ~/public_html/cricproace -type f -exec chmod 644 {} \;
   find ~/public_html/cricproace -type d -exec chmod 755 {} \;
   chmod 600 ~/public_html/cricproace/.env
   ```

3. Enable all security features in the application
4. Regularly update dependencies

## Support

For issues specific to:
- Application bugs: Check GitHub issues
- cPanel configuration: Contact your hosting provider
- Database issues: Check PostgreSQL logs

---

Last updated: June 28, 2025