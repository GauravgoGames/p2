# GitHub Upload & cPanel Deployment Guide

## Files Modified in This Session:
- `client/src/components/navbar.tsx` - Added mobile menu items, MainSite link, reorganized profile menu
- `client/src/components/footer.tsx` - Added Contact Us and Privacy Policy links
- `client/src/pages/tournament-analysis-page.tsx` - Removed status indicators from tournament selector
- `client/src/pages/leaderboard-page.tsx` - Fixed mobile responsiveness for Performance Comparison chart

## Step 1: Upload to GitHub

### Method A: Direct File Upload (Recommended)
1. Go to your GitHub repository: https://github.com/your-username/your-repo-name
2. Navigate to each modified file
3. Click "Edit this file" (pencil icon)
4. Copy the updated content from Replit
5. Commit changes with message: "Mobile responsiveness improvements and navigation updates"

### Method B: Git Commands (if you have local git setup)
```bash
git add .
git commit -m "Mobile responsiveness improvements and navigation updates"
git push origin main
```

## Step 2: Deploy to cPanel via SSH

### Connect to cPanel via SSH:
```bash
ssh your-username@your-domain.com
cd /path/to/your/website/folder
```

### Update from GitHub:
```bash
git pull origin main
npm install
npm run build
```

### Restart PM2 (if using PM2):
```bash
pm2 restart all
```

## Step 3: Verify Deployment
1. Check website functionality
2. Test mobile navigation
3. Verify responsive charts
4. Test all new features

## Key Updates Made:
✓ Mobile navigation includes: Tournaments, Tournament Analysis, Update Profile
✓ Header has MainSite link to main website
✓ Help and Update Profile moved to user dropdown
✓ Footer has Contact Us and Privacy Policy external links
✓ Performance Comparison chart is mobile-responsive with horizontal scroll
✓ Tournament selector shows clean names without status indicators

## Important Notes:
- Database data will be preserved during update
- User uploads in /uploads folder will remain intact
- The update-site.sh script can handle backup and restoration if needed