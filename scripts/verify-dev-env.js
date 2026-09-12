/**
 * CITYLINE CONSULTANCY — Development Environment Verification Script
 * Validates Node.js runtime, storage path safety, and environment integrity.
 */

const fs = require('fs');
const path = require('path');

function verifyEnvironment() {
  console.log('====================================================');
  console.log('CITYLINE CONSULTANCY — Dev Environment Verification');
  console.log('====================================================');

  let passed = true;

  // 1. Node.js runtime check
  const currentVersion = process.version;
  const majorVersion = parseInt(currentVersion.replace('v', '').split('.')[0], 10);
  console.log(`[CHECK 1] Node.js Version: ${currentVersion}`);
  if (majorVersion < 18) {
    console.error('  FAIL: Node.js version 18.x or higher is required.');
    passed = false;
  } else {
    console.log('  PASS: Node runtime version is compliant (>= 18.0.0).');
  }

  // 2. Environment file check
  const envPath = path.resolve(__dirname, '..', '.env');
  const envExamplePath = path.resolve(__dirname, '..', '.env.example');
  console.log(`[CHECK 2] Environment Configuration:`);
  if (fs.existsSync(envPath)) {
    console.log('  PASS: Local .env file exists.');
  } else {
    console.warn('  WARN: .env not found. Ensure you copy .env.example to .env before starting services.');
    if (fs.existsSync(envExamplePath)) {
      console.log('  PASS: .env.example template is available.');
    } else {
      console.error('  FAIL: .env.example template is missing.');
      passed = false;
    }
  }

  // 3. Storage path isolation check
  const rootDir = path.resolve(__dirname, '..');
  const devStorageDir = path.resolve(rootDir, 'storage');
  console.log(`[CHECK 3] Private File Storage Isolation:`);
  
  // Ensure storage is not inside public assets
  const publicDirFrontend = path.resolve(rootDir, 'frontend', 'public');
  if (devStorageDir.startsWith(publicDirFrontend)) {
    console.error('  CRITICAL FAIL: Private storage path resolves inside frontend/public!');
    passed = false;
  } else {
    console.log('  PASS: Private storage path is isolated outside frontend/public.');
  }

  // Create local storage scaffold if not present
  try {
    const subdirs = ['documents', 'resumes', 'temporary'];
    subdirs.forEach(sub => {
      const target = path.join(devStorageDir, sub);
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
      }
    });
    console.log('  PASS: Local storage scaffold verified (~/storage/documents, resumes, temporary).');
  } catch (err) {
    console.error(`  FAIL: Unable to initialize local storage scaffold: ${err.message}`);
    passed = false;
  }

  console.log('====================================================');
  if (passed) {
    console.log('RESULT: Environment check passed successfully.');
    process.exit(0);
  } else {
    console.error('RESULT: Environment check encountered issues.');
    process.exit(1);
  }
}

verifyEnvironment();
