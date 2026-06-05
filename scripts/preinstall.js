#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Remove incompatible lock files
try {
  const packageLock = path.join(process.cwd(), 'package-lock.json');
  const yarnLock = path.join(process.cwd(), 'yarn.lock');
  
  if (fs.existsSync(packageLock)) {
    fs.unlinkSync(packageLock);
    console.log('✓ Removed package-lock.json');
  }
  if (fs.existsSync(yarnLock)) {
    fs.unlinkSync(yarnLock);
    console.log('✓ Removed yarn.lock');
  }
} catch (err) {
  console.warn('⚠ Warning: Could not clean lock files', err.message);
}

// Check for pnpm
const userAgent = process.env.npm_config_user_agent || '';
if (!userAgent.includes('pnpm')) {
  console.error('');
  console.error('❌ ERROR: Please use pnpm instead of npm or yarn');
  console.error('');
  console.error('   Install pnpm globally:');
  console.error('   $ npm install -g pnpm');
  console.error('');
  console.error('   Then retry:');
  console.error('   $ pnpm install');
  console.error('');
  process.exit(1);
}

console.log('✓ Using pnpm - proceeding with installation');
