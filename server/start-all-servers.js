#!/usr/bin/env node

/**
 * Start all VB6 Studio servers
 * Main server, collaboration server, and AI server
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server configurations
const servers = [
  {
    name: 'Main Server',
    script: 'src/index.ts',
    port: 3011,
    env: { PORT: 3011 },
  },
  {
    name: 'Collaboration Server',
    script: 'src/collaboration/collaboration.server.ts',
    port: 3012,
    env: { COLLAB_PORT: 3012 },
  },
  {
    name: 'AI Server',
    script: 'src/ai/ai.server.ts',
    port: 3013,
    env: { AI_PORT: 3013 },
  },
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Start a server
function startServer(config, colorIndex) {
  const color = Object.values(colors)[colorIndex + 2]; // Skip reset and bright

  console.log(
    `${color}${colors.bright}Starting ${config.name} on port ${config.port}...${colors.reset}`
  );

  const child = spawn('npx', ['ts-node', config.script], {
    cwd: __dirname,
    env: { ...process.env, ...config.env },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  // Handle stdout
  child.stdout.on('data', data => {
    const lines = data
      .toString()
      .split('\n')
      .filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${config.name}]${colors.reset} ${line}`);
    });
  });

  // Handle stderr
  child.stderr.on('data', data => {
    const lines = data
      .toString()
      .split('\n')
      .filter(line => line.trim());
    lines.forEach(line => {
      console.error(`${colors.red}[${config.name} ERROR]${colors.reset} ${line}`);
    });
  });

  // Handle process exit
  child.on('exit', code => {
    console.log(`${color}[${config.name}]${colors.reset} Process exited with code ${code}`);
    if (code !== 0) {
      console.log(`${colors.yellow}Restarting ${config.name} in 5 seconds...${colors.reset}`);
      setTimeout(() => startServer(config, colorIndex), 5000);
    }
  });

  return child;
}

// Main execution
console.log(`${colors.bright}${colors.cyan}🚀 Starting VB6 Studio Servers...${colors.reset}\n`);

// Start all servers
const processes = servers.map((server, index) => startServer(server, index));

// Handle shutdown
process.on('SIGINT', () => {
  console.log(`\n${colors.bright}${colors.yellow}Shutting down all servers...${colors.reset}`);
  processes.forEach(child => {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  processes.forEach(child => {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  });
  process.exit(0);
});

// Keep the process running
process.stdin.resume();
