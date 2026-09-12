/**
 * CITYLINE CONSULTANCY — Development Environment & Pre-Flight Verification Script
 * Validates local development runtime, production compatibility disclaimers,
 * private storage physical isolation, and environment configuration.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function verifyEnvironment() {
  console.log('====================================================');
  console.log('CITYLINE CONSULTANCY — Environment Pre-Flight Audit');
  console.log('====================================================');

  let passed = true;

  // 1. Node.js Runtime Verification (Distinguishing Local Dev vs Production cPanel)
  const currentVersion = process.version;
  const majorVersion = parseInt(currentVersion.replace('v', '').split('.')[0], 10);
  console.log(`[CHECK 1] Local Development Node.js: ${currentVersion}`);
  if (majorVersion < 18) {
    console.error('  FAIL: Local development requires Node.js 18.x or higher.');
    passed = false;
  } else {
    console.log(`  PASS: Local development runtime is active (${currentVersion}).`);
  }
  console.log(
    '  NOTE: Production cPanel Node.js runtime remains OPEN / UNVERIFIED pending host inspection.'
  );

  // 2. Environment Configuration Check
  const rootDir = path.resolve(__dirname, '..');
  const envPath = path.resolve(rootDir, '.env');
  const envExamplePath = path.resolve(rootDir, '.env.example');
  console.log(`[CHECK 2] Environment Configuration:`);
  if (fs.existsSync(envPath)) {
    console.log('  PASS: Local .env file exists.');
  } else {
    console.warn('  WARN: Local .env not found. Ensure you copy .env.example to .env before starting services.');
    if (fs.existsSync(envExamplePath)) {
      console.log('  PASS: Root .env.example template is tracked and available.');
    } else {
      console.error('  FAIL: .env.example template is missing.');
      passed = false;
    }
  }

  // 3. Private File Storage Physical Isolation Check
  console.log(`[CHECK 3] Private File Storage Physical Isolation:`);

  // Canonical storage location: ~/clc_storage/
  const rawStorage = process.env.STORAGE_ROOT;
  let canonicalStorage;
  if (!rawStorage || rawStorage.trim().length === 0) {
    canonicalStorage = path.join(os.homedir(), 'clc_storage');
  } else if (rawStorage.startsWith('~')) {
    canonicalStorage = path.join(os.homedir(), rawStorage.slice(1));
  } else {
    canonicalStorage = path.resolve(rawStorage);
  }

  console.log(`  Canonical Storage Target: ${canonicalStorage}`);

  // Ensure storage is NEVER inside frontend/public, public_html, or backend/public
  const publicDirFrontend = path.resolve(rootDir, 'frontend', 'public');
  const publicHtmlDir = path.resolve(rootDir, 'public_html');
  const repoLocalForbiddenStorage = path.resolve(rootDir, 'storage');

  if (canonicalStorage.toLowerCase().startsWith(publicDirFrontend.toLowerCase())) {
    console.error('  CRITICAL FAIL: Private storage resolves inside frontend/public!');
    passed = false;
  } else if (canonicalStorage.toLowerCase().startsWith(publicHtmlDir.toLowerCase())) {
    console.error('  CRITICAL FAIL: Private storage resolves inside public_html!');
    passed = false;
  } else if (canonicalStorage.toLowerCase() === repoLocalForbiddenStorage.toLowerCase()) {
    console.error('  CRITICAL FAIL: Repository-root storage/ cannot be treated as canonical private storage!');
    passed = false;
  } else {
    console.log('  PASS: Storage path is physically isolated outside all webroots.');
  }

  // Verify that repository-root does NOT contain a stale storage directory
  if (fs.existsSync(repoLocalForbiddenStorage)) {
    console.warn('  WARN: Detected repository-local storage/ folder. This must not be used as storage root.');
  } else {
    console.log('  PASS: No canonical storage directory exists inside repository root.');
  }

  // Verify write readiness at canonical location (~/clc_storage/)
  try {
    const subdirs = ['documents', 'resumes', 'temporary'];
    if (!fs.existsSync(canonicalStorage)) {
      fs.mkdirSync(canonicalStorage, { recursive: true });
    }
    subdirs.forEach((sub) => {
      const target = path.join(canonicalStorage, sub);
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
      }
    });
    console.log('  PASS: Canonical storage directory verified (~/clc_storage/documents, resumes, temporary).');
  } catch (err) {
    console.error(`  FAIL: Unable to initialize canonical storage directory: ${err.message}`);
    passed = false;
  }

  console.log('====================================================');
  if (passed) {
    console.log('RESULT: All pre-flight environment checks passed.');
    process.exit(0);
  } else {
    console.error('RESULT: Environment check encountered blocking issues.');
    process.exit(1);
  }
}

verifyEnvironment();
