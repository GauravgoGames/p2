// Main Application Script
// This script serves as the entry point for running the website workflow in Replit

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

// Set port (using 5000 as required)
const PORT = process.env.PORT || 5000;

console.log('=== P2 Website Workflow Application ===');
console.log('This application helps you clone, improve, and prepare the GauravgoGames/p2 repository for cPanel deployment.');

// Helper function to check if repository exists
function checkRepository() {
  return fs.existsSync(path.join(process.cwd(), 'p2'));
}

// Helper function to execute a shell command and return output
function executeCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Command execution error: ${error.message}`);
    return null;
  }
}

// Create a simple HTTP server to provide a web interface
const server = http.createServer((req, res) => {
  if (req.url === '/run-clone' && req.method === 'POST') {
    // Run the clone repository script
    console.log('Running clone repository script...');
    const output = executeCommand('bash clone_repo.sh');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(output || 'Command failed. Check console for details.');
    return;
  }
  
  if (req.url === '/run-analyze' && req.method === 'POST') {
    // Run the analyze website script
    console.log('Running website analysis script...');
    const output = executeCommand('node analyze_website.js');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(output || 'Command failed. Check console for details.');
    return;
  }
  
  if (req.url === '/run-improve' && req.method === 'POST') {
    // Run the improve website script
    console.log('Running website improvement script...');
    const output = executeCommand('node improve_website.js');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(output || 'Command failed. Check console for details.');
    return;
  }
  
  if (req.url === '/run-organize' && req.method === 'POST') {
    // Run the organize for cPanel script
    console.log('Running cPanel organization script...');
    const output = executeCommand('bash organize_for_cpanel.sh');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(output || 'Command failed. Check console for details.');
    return;
  }
  
  if (req.url === '/deployment-guide' && req.method === 'GET') {
    // Serve the deployment guide
    try {
      const guide = fs.readFileSync(path.join(process.cwd(), 'cpanel_deployment_guide.md'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(guide);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading deployment guide');
    }
    return;
  }
  
  // Default: serve the main HTML page
  res.writeHead(200, { 'Content-Type': 'text/html' });
  
  // Check repository status
  const repoExists = checkRepository();
  
  // Compose HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>P2 Website Workflow</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        
        h1, h2 {
            color: #2c3e50;
        }
        
        .container {
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .steps {
            counter-reset: step-counter;
        }
        
        .step {
            margin-bottom: 15px;
            padding: 15px;
            background-color: #fff;
            border-radius: 5px;
            border-left: 4px solid #3498db;
            counter-increment: step-counter;
        }
        
        .step h3::before {
            content: "Step " counter(step-counter) ": ";
            color: #3498db;
            font-weight: bold;
        }
        
        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        
        button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        
        button:hover:not(:disabled) {
            background-color: #2980b9;
        }
        
        .status {
            margin-top: 10px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .completed {
            border-left-color: #2ecc71;
        }
        
        .current {
            border-left-color: #f39c12;
        }
        
        .console {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <h1>P2 Website Workflow</h1>
    <div class="container">
        <p>This workflow helps you clone, improve, and prepare the GauravgoGames/p2 repository for cPanel deployment.</p>
        <p>Repository Status: <strong>${repoExists ? 'Found in the workspace' : 'Not yet cloned'}</strong></p>
    </div>
    
    <div class="steps">
        <div class="step ${repoExists ? 'completed' : 'current'}" id="step1">
            <h3>Clone Repository</h3>
            <p>Clone the GauravgoGames/p2 GitHub repository into the Replit environment.</p>
            <button onclick="runCommand('clone')" ${repoExists ? 'disabled' : ''}>
                ${repoExists ? 'Already Completed' : 'Clone Repository'}
            </button>
            <div class="status" id="clone-status">${repoExists ? 'Repository already cloned.' : ''}</div>
        </div>
        
        <div class="step" id="step2">
            <h3>Analyze Website</h3>
            <p>Analyze the current website structure and functionality.</p>
            <button onclick="runCommand('analyze')" ${!repoExists ? 'disabled' : ''}>Analyze Website</button>
            <div class="status" id="analyze-status"></div>
        </div>
        
        <div class="step" id="step3">
            <h3>Improve Website</h3>
            <p>Implement website improvements including design, performance, and organization.</p>
            <button onclick="runCommand('improve')" ${!repoExists ? 'disabled' : ''}>Improve Website</button>
            <div class="status" id="improve-status"></div>
        </div>
        
        <div class="step" id="step4">
            <h3>Prepare for cPanel</h3>
            <p>Organize files in a cPanel-compatible structure and create a deployment package.</p>
            <button onclick="runCommand('organize')" ${!repoExists ? 'disabled' : ''}>Prepare for cPanel</button>
            <div class="status" id="organize-status"></div>
        </div>
        
        <div class="step" id="step5">
            <h3>Deployment Guide</h3>
            <p>View detailed instructions for deploying the website to cPanel.</p>
            <button onclick="viewDeploymentGuide()">View Deployment Guide</button>
        </div>
    </div>
    
    <div class="console" id="console-output">
        > Workflow application started. Follow the steps above to prepare your website for deployment.
    </div>
    
    <script>
        function runCommand(command) {
            const statusElement = document.getElementById(command + '-status');
            const consoleOutput = document.getElementById('console-output');
            
            statusElement.textContent = 'Running command...';
            consoleOutput.textContent += '\\n> Running ' + command + ' command...';
            
            fetch('/run-' + command, {
                method: 'POST'
            })
            .then(response => response.text())
            .then(data => {
                statusElement.textContent = 'Command completed.';
                consoleOutput.textContent += '\\n' + data;
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
                
                // Update UI state
                const steps = document.querySelectorAll('.step');
                let currentStepFound = false;
                
                steps.forEach((step, index) => {
                    if (step.id === 'step' + (index + 1)) {
                        if (command === 'clone' && index === 0) {
                            step.classList.add('completed');
                            step.classList.remove('current');
                            document.querySelector('#step' + (index + 1) + ' button').disabled = true;
                            
                            if (steps[index + 1]) {
                                steps[index + 1].classList.add('current');
                                document.querySelector('#step' + (index + 2) + ' button').disabled = false;
                            }
                        }
                        
                        if (command === 'analyze' && index === 1) {
                            step.classList.add('completed');
                            step.classList.remove('current');
                            
                            if (steps[index + 1]) {
                                steps[index + 1].classList.add('current');
                            }
                        }
                        
                        if (command === 'improve' && index === 2) {
                            step.classList.add('completed');
                            step.classList.remove('current');
                            
                            if (steps[index + 1]) {
                                steps[index + 1].classList.add('current');
                            }
                        }
                        
                        if (command === 'organize' && index === 3) {
                            step.classList.add('completed');
                            step.classList.remove('current');
                            
                            if (steps[index + 1]) {
                                steps[index + 1].classList.add('current');
                            }
                        }
                    }
                });
            })
            .catch(error => {
                statusElement.textContent = 'Error: ' + error.message;
                consoleOutput.textContent += '\\nError: ' + error.message;
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
            });
        }
        
        function viewDeploymentGuide() {
            const consoleOutput = document.getElementById('console-output');
            consoleOutput.textContent += '\\n> Loading deployment guide...';
            
            fetch('/deployment-guide')
            .then(response => response.text())
            .then(data => {
                const newWindow = window.open();
                newWindow.document.write('<html><head><title>cPanel Deployment Guide</title>');
                newWindow.document.write('<style>body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; } h1, h2, h3 { color: #2c3e50; } pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }</style>');
                newWindow.document.write('</head><body><pre>' + data + '</pre></body></html>');
                consoleOutput.textContent += '\\n> Deployment guide opened in new tab/window.';
            })
            .catch(error => {
                consoleOutput.textContent += '\\nError loading deployment guide: ' + error.message;
            });
        }
    </script>
</body>
</html>
`;
  
  res.end(html);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log('Open the URL in your browser to start the workflow process.');
  console.log('\nWorkflow steps:');
  console.log('1. Clone Repository: Clone the GauravgoGames/p2 GitHub repository');
  console.log('2. Analyze Website: Analyze the current website structure');
  console.log('3. Improve Website: Implement website improvements');
  console.log('4. Prepare for cPanel: Organize files for cPanel deployment');
  console.log('5. Deployment Guide: View cPanel deployment instructions');
});
