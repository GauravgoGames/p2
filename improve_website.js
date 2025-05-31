// Website Improvement Script
// This script makes improvements to the cloned website for better performance and organization

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Starting Website Improvement Process ===');

// Define repository path
const repoPath = path.join(process.cwd(), 'p2');
const backupPath = path.join(process.cwd(), 'p2_backup');

// Check if repository exists
if (!fs.existsSync(repoPath)) {
  console.error('Error: Repository directory not found. Please run the clone_repo.sh script first.');
  process.exit(1);
}

try {
  // Create a backup of the original repository
  console.log('Creating backup of original repository...');
  if (fs.existsSync(backupPath)) {
    fs.rmSync(backupPath, { recursive: true, force: true });
  }
  fs.cpSync(repoPath, backupPath, { recursive: true });
  console.log('Backup created successfully at:', backupPath);
  
  // Create standard directory structure if it doesn't exist
  console.log('\nImproving directory structure...');
  const directories = ['css', 'js', 'images', 'fonts'];
  
  directories.forEach(dir => {
    const dirPath = path.join(repoPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created ${dir} directory`);
    }
  });
  
  // Move CSS files to css directory
  console.log('\nOrganizing CSS files...');
  const cssFiles = findFiles(repoPath, '.css');
  moveFilesToDirectory(cssFiles, 'css');
  
  // Move JavaScript files to js directory
  console.log('\nOrganizing JavaScript files...');
  const jsFiles = findFiles(repoPath, '.js');
  moveFilesToDirectory(jsFiles, 'js');
  
  // Identify and move image files to images directory
  console.log('\nOrganizing image files...');
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp'];
  const imageFiles = [];
  
  imageExtensions.forEach(ext => {
    imageFiles.push(...findFiles(repoPath, ext));
  });
  
  moveFilesToDirectory(imageFiles, 'images');
  
  // Update paths in HTML files
  console.log('\nUpdating file references in HTML files...');
  const htmlFiles = findFiles(repoPath, '.html');
  updateFileReferences(htmlFiles);
  
  // Create .htaccess file for cPanel
  console.log('\nCreating .htaccess file for cPanel...');
  const htaccessPath = path.join(repoPath, '.htaccess');
  const htaccessContent = `
# Basic .htaccess file for cPanel hosting
AddDefaultCharset UTF-8

# Enable URL rewriting
RewriteEngine On

# Redirect non-www to www (uncomment if needed)
# RewriteCond %{HTTP_HOST} !^www\. [NC]
# RewriteRule ^(.*)$ http://www.%{HTTP_HOST}/$1 [R=301,L]

# Set default index files
DirectoryIndex index.html index.htm index.php

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/x-javascript application/json
</IfModule>

# Enable browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 1 day"
</IfModule>

# Disable directory browsing
Options -Indexes
`;
  fs.writeFileSync(htaccessPath, htaccessContent.trim());
  console.log('Created .htaccess file');
  
  // Create robots.txt
  console.log('\nCreating robots.txt file...');
  const robotsPath = path.join(repoPath, 'robots.txt');
  const robotsContent = `
User-agent: *
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml
`;
  fs.writeFileSync(robotsPath, robotsContent.trim());
  console.log('Created robots.txt file');
  
  // Basic SEO improvements - create favicon if not exists
  console.log('\nChecking for favicon...');
  const faviconPath = path.join(repoPath, 'favicon.ico');
  if (!fs.existsSync(faviconPath)) {
    console.log('No favicon found. Please add a favicon.ico file manually.');
  }
  
  // Check for missing index.html and create a simple one if needed
  const indexPath = path.join(repoPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('\nNo index.html found. Creating a basic one...');
    const htmlFiles = findFiles(repoPath, '.html');
    
    let indexContent;
    if (htmlFiles.length > 0) {
      // Create an index page that links to existing HTML files
      indexContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Index</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        header {
            background-color: #f4f4f4;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        nav ul {
            list-style: none;
            padding: 0;
        }
        nav li {
            margin-bottom: 10px;
        }
        a {
            color: #1a73e8;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <header>
        <h1>Website Navigation</h1>
        <p>Welcome to the website. Please use the links below to navigate.</p>
    </header>
    
    <nav>
        <h2>Pages:</h2>
        <ul>
${htmlFiles.map(file => {
  const relativePath = path.relative(repoPath, file);
  const fileName = path.basename(relativePath);
  const displayName = fileName.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `            <li><a href="${relativePath}">${displayName}</a></li>`;
}).join('\n')}
        </ul>
    </nav>
    
    <footer>
        <p>&copy; ${new Date().getFullYear()} - All Rights Reserved</p>
    </footer>
</body>
</html>
`;
    } else {
      // Create a completely new index page
      indexContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Website</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            width: 80%;
            margin: auto;
            overflow: hidden;
        }
        header {
            background: #35424a;
            color: white;
            padding-top: 30px;
            min-height: 70px;
            border-bottom: #e8491d 3px solid;
        }
        header a {
            color: #fff;
            text-decoration: none;
            text-transform: uppercase;
            font-size: 16px;
        }
        header .brand {
            float: left;
        }
        header .brand h1 {
            margin: 0;
        }
        header nav {
            float: right;
            margin-top: 10px;
        }
        header li {
            display: inline;
            padding: 0 20px;
        }
        header a:hover {
            color: #ccc;
            font-weight: bold;
        }
        .highlight, header .current a {
            color: #e8491d;
            font-weight: bold;
        }
        .showcase {
            min-height: 400px;
            background: url('images/showcase.jpg') no-repeat center;
            background-size: cover;
            text-align: center;
            color: white;
        }
        .showcase h1 {
            margin-top: 100px;
            font-size: 55px;
            margin-bottom: 10px;
        }
        .showcase p {
            font-size: 20px;
        }
        .boxes {
            margin-top: 20px;
        }
        .box {
            float: left;
            width: 30%;
            padding: 10px;
            text-align: center;
        }
        footer {
            padding: 20px;
            margin-top: 20px;
            color: #fff;
            background-color: #35424a;
            text-align: center;
        }
        @media(max-width: 768px) {
            header .brand, header nav, header nav li,
            .box {
                float: none;
                text-align: center;
                width: 100%;
            }
            header {
                padding-bottom: 20px;
            }
            .showcase h1 {
                margin-top: 40px;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="brand">
                <h1>Company Name</h1>
            </div>
            <nav>
                <ul>
                    <li class="current"><a href="index.html">Home</a></li>
                    <li><a href="#">Services</a></li>
                    <li><a href="#">About</a></li>
                    <li><a href="#">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <section class="showcase">
        <div class="container">
            <h1>Welcome to Our Website</h1>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu luctus ipsum, rhoncus semper magna.</p>
        </div>
    </section>

    <section class="boxes">
        <div class="container">
            <div class="box">
                <h3>Feature One</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mi augue, viverra sit amet ultricies.</p>
            </div>
            <div class="box">
                <h3>Feature Two</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mi augue, viverra sit amet ultricies.</p>
            </div>
            <div class="box">
                <h3>Feature Three</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus mi augue, viverra sit amet ultricies.</p>
            </div>
        </div>
    </section>

    <footer>
        <p>&copy; ${new Date().getFullYear()} Company Name. All Rights Reserved.</p>
    </footer>
</body>
</html>
`;
    }
    
    fs.writeFileSync(indexPath, indexContent.trim());
    console.log('Created index.html file');
  }
  
  // Create a basic CSS file if none exists
  const cssDir = path.join(repoPath, 'css');
  const styleFile = path.join(cssDir, 'style.css');
  if (!fs.existsSync(styleFile) && fs.readdirSync(cssDir).length === 0) {
    console.log('\nCreating basic style.css file...');
    const cssContent = `
/* Basic CSS Reset and Common Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
}

.container {
    width: 80%;
    margin: auto;
    overflow: hidden;
}

ul {
    list-style: none;
}

a {
    color: #333;
    text-decoration: none;
}

h1, h2, h3, h4, h5, h6 {
    margin-bottom: 15px;
}

p {
    margin-bottom: 10px;
}

img {
    max-width: 100%;
    height: auto;
}

/* Header Styles */
header {
    background: #35424a;
    color: white;
    padding: 20px 0;
    margin-bottom: 20px;
    border-bottom: #e8491d 3px solid;
}

header a {
    color: white;
}

header h1 {
    float: left;
}

header nav {
    float: right;
    margin-top: 10px;
}

header nav ul li {
    display: inline;
    padding: 0 15px;
}

header a:hover {
    color: #ccc;
}

/* Main Content Styles */
.main-content {
    background: white;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

/* Button Styles */
.btn {
    display: inline-block;
    background: #35424a;
    color: white;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    font-size: 16px;
    border-radius: 5px;
}

.btn:hover {
    background: #29353d;
}

.btn-primary {
    background: #e8491d;
}

.btn-primary:hover {
    background: #c73d17;
}

/* Footer Styles */
footer {
    background: #35424a;
    color: white;
    text-align: center;
    padding: 20px;
    margin-top: 20px;
}

/* Responsive Styles */
@media(max-width: 768px) {
    header h1, header nav, header nav ul li {
        float: none;
        text-align: center;
        padding: 5px;
    }
    
    .container {
        width: 90%;
    }
}
`;
    fs.writeFileSync(styleFile, cssContent.trim());
    console.log('Created basic style.css file');
  }
  
  console.log('\n=== Website Improvement Process Completed ===');
  console.log('The website has been reorganized and improved.');
  console.log('Run "bash organize_for_cpanel.sh" to prepare the website for cPanel deployment.');
  
} catch (error) {
  console.error('Error during improvement process:', error.message);
  process.exit(1);
}

// Helper Functions
function findFiles(directory, extension) {
  const files = [];
  
  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip our newly created directories and other special directories
        if (!['css', 'js', 'images', 'fonts', 'node_modules', '.git'].includes(entry.name)) {
          traverse(entryPath);
        }
      } else if (entry.name.toLowerCase().endsWith(extension)) {
        files.push(entryPath);
      }
    }
  }
  
  traverse(directory);
  return files;
}

function moveFilesToDirectory(files, targetDir) {
  const targetDirPath = path.join(repoPath, targetDir);
  let movedCount = 0;
  
  // Skip files that are already in the target directory
  const filesToMove = files.filter(file => {
    const relativePath = path.relative(repoPath, file);
    return !relativePath.startsWith(targetDir + path.sep);
  });
  
  for (const file of filesToMove) {
    const fileName = path.basename(file);
    const targetPath = path.join(targetDirPath, fileName);
    
    try {
      // Check if file already exists in target directory
      if (fs.existsSync(targetPath)) {
        console.log(`  Skipping ${fileName} (already exists in ${targetDir} directory)`);
        continue;
      }
      
      // Copy the file to the target directory
      fs.copyFileSync(file, targetPath);
      
      // Delete the original file
      fs.unlinkSync(file);
      
      console.log(`  Moved ${fileName} to ${targetDir} directory`);
      movedCount++;
    } catch (error) {
      console.error(`  Error moving ${fileName}: ${error.message}`);
    }
  }
  
  console.log(`  Total files moved to ${targetDir} directory: ${movedCount}`);
}

function updateFileReferences(htmlFiles) {
  const updates = {
    count: 0
  };
  
  for (const htmlFile of htmlFiles) {
    try {
      let content = fs.readFileSync(htmlFile, 'utf8');
      let originalContent = content;
      
      // Update CSS references
      content = content.replace(/(href\s*=\s*["'])\s*(?!https?:\/\/|\/\/|css\/|http)(.*?\.css)(["'])/gi, (match, p1, p2, p3) => {
        const fileName = path.basename(p2);
        return `${p1}css/${fileName}${p3}`;
      });
      
      // Update JS references
      content = content.replace(/(src\s*=\s*["'])\s*(?!https?:\/\/|\/\/|js\/|http)(.*?\.js)(["'])/gi, (match, p1, p2, p3) => {
        const fileName = path.basename(p2);
        return `${p1}js/${fileName}${p3}`;
      });
      
      // Update image references
      content = content.replace(/(src\s*=\s*["'])\s*(?!https?:\/\/|\/\/|images\/|http)(.*?\.(jpg|jpeg|png|gif|svg|webp))(["'])/gi, (match, p1, p2, p3, p4) => {
        const fileName = path.basename(p2);
        return `${p1}images/${fileName}${p4}`;
      });
      
      // Only write file if changes were made
      if (content !== originalContent) {
        fs.writeFileSync(htmlFile, content);
        updates.count++;
        console.log(`  Updated references in ${path.basename(htmlFile)}`);
      }
    } catch (error) {
      console.error(`  Error updating references in ${path.basename(htmlFile)}: ${error.message}`);
    }
  }
  
  console.log(`  Total HTML files updated: ${updates.count}`);
}
