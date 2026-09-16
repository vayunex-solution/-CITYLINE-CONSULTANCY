#!/usr/bin/env node

/**
 * CITYLINE CONSULTANCY — Production cPanel UI Build & Export Pipeline
 * 
 * Workflow:
 * 1. Sets NEXT_EXPORT=true environment variable
 * 2. Compiles static HTML/CSS/JS export via Next.js into frontend/out
 * 3. Copies production .htaccess into frontend/out/.htaccess
 * 4. Verifies output integrity for cPanel Git Versioning deployment
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const OUT_DIR = path.join(FRONTEND_DIR, 'out');
const HTACCESS_SRC = path.join(FRONTEND_DIR, 'public_html_htaccess');
const HTACCESS_DEST = path.join(OUT_DIR, '.htaccess');

console.log('\n========================================================');
console.log('  CITYLINE CONSULTANCY — PRODUCTION cPANEL BUILD');
console.log('========================================================\n');

// 1. Set environment variable for static export
const env = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_EXPORT: 'true',
};

console.log('⚙️  Step 1: Compiling static UI export via Next.js...');
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const buildResult = spawnSync(npxCmd, ['next', 'build'], {
  cwd: FRONTEND_DIR,
  env,
  stdio: 'inherit',
  shell: true,
});

if (buildResult.status !== 0) {
  console.error('\n❌ Build failed! Please review Next.js compilation errors above.\n');
  process.exit(buildResult.status || 1);
}

// 2. Ensure out directory exists
if (!fs.existsSync(OUT_DIR)) {
  console.error(`\n❌ Expected export directory not found: ${OUT_DIR}\n`);
  process.exit(1);
}

// 3. Inject production .htaccess into out/.htaccess
console.log('\n⚙️  Step 2: Injecting production Apache .htaccess into out/ directory...');
if (fs.existsSync(HTACCESS_SRC)) {
  fs.copyFileSync(HTACCESS_SRC, HTACCESS_DEST);
  console.log('   ✓ Copied frontend/public_html_htaccess -> frontend/out/.htaccess');
} else {
  console.warn('   ⚠️ Warning: public_html_htaccess template not found, skipping copy.');
}

// 4. Verify critical routes exist
console.log('\n⚙️  Step 3: Verifying exported static assets...');
const requiredFiles = [
  'index.html',
  '404.html',
  path.join('about', 'index.html'),
  path.join('contact', 'index.html'),
  path.join('jobs', 'index.html'),
  path.join('business-setup', 'index.html'),
  path.join('recruitment', 'index.html'),
  path.join('visa-services', 'index.html'),
  '.htaccess',
];

let allValid = true;
for (const relFile of requiredFiles) {
  const fullPath = path.join(OUT_DIR, relFile);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✓ ${relFile}`);
  } else {
    console.warn(`   ⚠️ Missing file: ${relFile}`);
    allValid = false;
  }
}

if (!allValid) {
  console.warn('\n⚠️ Some expected static files were missing. Check build logs.');
} else {
  console.log('\n✅ Static UI build successfully verified!');
}

console.log('\n========================================================');
console.log('  NEXT STEPS FOR DEPLOYMENT:');
console.log('========================================================');
console.log('1. Commit your changes to Git:');
console.log('   git add .');
console.log('   git commit -m "feat(deploy): update production UI build for cPanel"');
console.log('   git push origin main');
console.log('');
console.log('2. In cPanel > Git™ Versioning:');
console.log('   - Click "Update from Remote" / "Pull"');
console.log('   - Click "Deploy HEAD Commit"');
console.log('   - .cpanel.yml will automatically copy frontend/out/* to /public_html');
console.log('========================================================\n');
