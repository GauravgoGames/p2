# cPanel Deployment Guide

This guide provides step-by-step instructions for deploying the improved website to a cPanel hosting environment.

## Prerequisites

Before you begin, make sure you have:

1. A cPanel hosting account with login credentials
2. The prepared website deployment package (`p2_cpanel.zip`)
3. FTP client (optional) such as FileZilla or WinSCP

## Deployment Steps

### Method 1: Using cPanel File Manager

1. **Login to cPanel**
   - Open your web browser and navigate to `https://yourdomain.com/cpanel` or the URL provided by your hosting provider
   - Enter your cPanel username and password

2. **Access File Manager**
   - In the cPanel dashboard, locate and click on the "File Manager" icon
   - If prompted, select "Web Root (public_html/www)" as the directory to open
   - Click "Go"

3. **Remove Existing Files (if needed)**
   - If you're replacing an existing website, you might want to backup your current files first
   - Select all files and folders in your public_html directory
   - Click "Compress" to create a backup
   - After backup, select all files and folders again and click "Delete"

4. **Upload the Deployment Package**
   - In File Manager, click the "Upload" button
   - Select the `p2_cpanel.zip` file from your computer
   - Wait for the upload to complete

5. **Extract the Deployment Package**
   - Navigate to the location where you uploaded the zip file
   - Right-click on the zip file and select "Extract"
   - In the extraction dialog, ensure the files will be extracted to the correct directory (typically public_html)
   - Click "Extract File(s)"

6. **Verify Deployment**
   - Once extraction is complete, navigate to your website URL to verify it's working correctly
   - Check that all pages, images, and functionality work as expected

### Method 2: Using FTP

1. **Connect to Your Server via FTP**
   - Open your FTP client (FileZilla, WinSCP, etc.)
   - Enter your hosting server details:
     - Host: Your domain or FTP host (often ftp.yourdomain.com)
     - Username: Your cPanel username
     - Password: Your cPanel password
     - Port: 21 (or as specified by your host)
   - Click "Connect" or "Login"

2. **Navigate to the Web Root Directory**
   - On the remote server side, navigate to the web root directory (usually public_html)
   - If replacing an existing website, consider downloading the current files as a backup

3. **Upload Website Files**
   - Extract the `p2_cpanel.zip` on your local computer
   - Select all the extracted files and folders
   - Upload them to the web root directory on the server
   - Wait for the upload to complete

4. **Set File Permissions**
   - Select all files and set permissions to 644 (rw-r--r--)
   - Select all folders and set permissions to 755 (rwxr-xr-x)
   - For specific scripts or applications, you may need different permissions

5. **Verify Deployment**
   - Visit your website URL in a browser to ensure everything is working correctly

## Post-Deployment Tasks

After deploying your website, perform these tasks:

1. **Check Website Functionality**
   - Visit all pages to ensure they load correctly
   - Test all links, forms, and interactive elements
   - Verify that images and CSS styles are loading properly

2. **Configure Domain and SSL (if needed)**
   - If this is a new domain, make sure DNS is properly configured
   - Set up SSL certificate via cPanel's "SSL/TLS" or "Let's Encrypt" tool

3. **Setup Email Accounts (if needed)**
   - Create email accounts via cPanel's "Email Accounts" tool

4. **Configure Backup Settings**
   - Set up regular backups using cPanel's "Backup" or "Backup Wizard" tool

5. **Optimize Performance**
   - Enable caching if available in your cPanel
   - Configure Cloudflare integration if desired

## Troubleshooting Common Issues

### Website Not Loading
- Check if index.html exists in the root directory
- Verify file permissions (644 for files, 755 for directories)
- Check error logs in cPanel

### Broken Links or Missing Images
- Ensure all file paths are correct
- Check if the files exist in the specified directories
- Verify that the .htaccess file isn't causing redirection issues

### Permission Errors
- For dynamic content or scripts, ensure the files have the correct permissions
- PHP files typically need 644 permissions
- Directories should have 755 permissions

### 500 Internal Server Error
- Check your .htaccess file for syntax errors
- Review cPanel error logs for specific details
- Contact your hosting provider if the issue persists

## Additional Resources

- [cPanel Documentation](https://docs.cpanel.net/)
- [.htaccess Guide](https://httpd.apache.org/docs/current/howto/htaccess.html)
- [DNS Management Guide](https://support.cloudflare.com/hc/en-us/articles/360019093151)

For further assistance, contact your hosting provider's support team.
