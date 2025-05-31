// Website Analysis Script
// This script analyzes the cloned website structure and provides insights for improvement

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Starting Website Analysis ===');

// Define repository path
const repoPath = path.join(process.cwd(), 'p2');

// Check if repository exists
if (!fs.existsSync(repoPath)) {
  console.error('Error: Repository directory not found. Please run the clone_repo.sh script first.');
  process.exit(1);
}

// File counts and sizes
let totalFiles = 0;
let totalSize = 0;
const fileTypes = {};
const largeFiles = [];
const htmlFiles = [];
const cssFiles = [];
const jsFiles = [];
let indexFile = null;

// Analyze repository structure recursively
function analyzeDirectory(dirPath, relativePath = '') {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const itemRelativePath = path.join(relativePath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.git', '.vscode'].includes(item)) {
        analyzeDirectory(itemPath, itemRelativePath);
      }
    } else if (stats.isFile()) {
      totalFiles++;
      totalSize += stats.size;
      
      // Get file extension
      const ext = path.extname(item).toLowerCase();
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      
      // Track large files (greater than 500KB)
      if (stats.size > 500 * 1024) {
        largeFiles.push({
          path: itemRelativePath,
          size: (stats.size / 1024).toFixed(2) + ' KB'
        });
      }
      
      // Track HTML files
      if (ext === '.html' || ext === '.htm') {
        htmlFiles.push(itemRelativePath);
        if (item.toLowerCase() === 'index.html') {
          indexFile = itemRelativePath;
        }
      }
      
      // Track CSS files
      if (ext === '.css') {
        cssFiles.push(itemRelativePath);
      }
      
      // Track JS files
      if (ext === '.js') {
        jsFiles.push(itemRelativePath);
      }
    }
  }
}

try {
  // Analyze repository
  analyzeDirectory(repoPath);
  
  // Print analysis results
  console.log('\n=== Website Structure Analysis ===');
  console.log(`Total Files: ${totalFiles}`);
  console.log(`Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
  
  console.log('\nFile Types:');
  for (const [ext, count] of Object.entries(fileTypes)) {
    console.log(`  ${ext || 'No extension'}: ${count} files`);
  }
  
  console.log('\nHTML Files:');
  htmlFiles.forEach(file => console.log(`  ${file}`));
  
  console.log('\nCSS Files:');
  cssFiles.forEach(file => console.log(`  ${file}`));
  
  console.log('\nJavaScript Files:');
  jsFiles.forEach(file => console.log(`  ${file}`));
  
  console.log('\nLarge Files (>500KB):');
  if (largeFiles.length === 0) {
    console.log('  None found');
  } else {
    largeFiles.forEach(file => console.log(`  ${file.path} (${file.size})`));
  }
  
  console.log('\nMain Index File:');
  console.log(indexFile ? `  ${indexFile}` : '  No index.html file found');
  
  // Identify potential improvement areas
  console.log('\n=== Potential Improvement Areas ===');
  
  // Check for missing index.html
  if (!indexFile) {
    console.log('- No index.html found. Consider creating one as the main entry point.');
  }
  
  // Check for large files
  if (largeFiles.length > 0) {
    console.log(`- ${largeFiles.length} large files found. Consider optimizing these for better performance.`);
  }
  
  // Check for CSS/JS organization
  if (cssFiles.length > 0 && !cssFiles.some(file => file.includes('/css/'))) {
    console.log('- CSS files not organized in a dedicated directory. Consider creating a /css directory.');
  }
  
  if (jsFiles.length > 0 && !jsFiles.some(file => file.includes('/js/'))) {
    console.log('- JavaScript files not organized in a dedicated directory. Consider creating a /js directory.');
  }
  
  console.log('\nAnalysis complete. Run "node ../improve_website.js" to start improving the website.');
  
} catch (error) {
  console.error('Error during analysis:', error.message);
  process.exit(1);
}
