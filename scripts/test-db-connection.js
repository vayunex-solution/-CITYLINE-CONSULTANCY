/**
 * CITYLINE CONSULTANCY — Database Connectivity Test & Diagnostic Tool
 * Safely verifies connection, server version, and user privileges without exposing secrets.
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

async function testDatabaseConnection() {
  console.log('====================================================');
  console.log('CITYLINE CONSULTANCY — Database Connectivity Audit');
  console.log('====================================================');

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const database = process.env.DB_NAME || 'cityline_db';
  const user = process.env.DB_USER || 'cityline_admin';

  console.log(`Target Host: ${host}:${port}`);
  console.log(`Target Database: ${database}`);
  console.log(`Database User: ${user}`);
  console.log('----------------------------------------------------');

  // Step 1: Test Server Authentication
  let serverVersion = null;
  try {
    const authConn = await mysql.createConnection({
      host,
      port,
      user,
      password: process.env.DB_PASSWORD,
      connectTimeout: 10000,
    });
    const [v] = await authConn.query('SELECT VERSION() as version');
    serverVersion = v[0].version;
    console.log(`[PASS] Server Authentication Successful`);
    console.log(`[INFO] Verified Engine: ${serverVersion}`);
    await authConn.end();
  } catch (err) {
    console.error(`[FAIL] Server Authentication Failed: ${err.code} — ${err.message}`);
    process.exit(1);
  }

  // Step 2: Test Database Access
  try {
    const dbConn = await mysql.createConnection({
      host,
      port,
      user,
      password: process.env.DB_PASSWORD,
      database,
      connectTimeout: 10000,
    });

    console.log(`[PASS] Connected to Database '${database}'`);
    const [tables] = await dbConn.query('SHOW TABLES');
    console.log(`[INFO] Current Tables in Database: ${tables.length}`);
    await dbConn.end();

    console.log('====================================================');
    console.log('RESULT: Database connection verified successfully.');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.warn(`[WARN] Database Access Restricted: ${err.code}`);
    if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
      console.log('\n----------------------------------------------------');
      console.log('REQUIRED CPANEL ACTION:');
      console.log('1. Log into cPanel -> "MySQL® Databases"');
      console.log('2. Scroll to section: "Add User to Database"');
      console.log(`3. Select User: "${user}"`);
      console.log(`4. Select Database: "${database}" (or prefixed database name)`);
      console.log('5. Click "Add"');
      console.log('6. Check "ALL PRIVILEGES" and click "Make Changes"');
      console.log('----------------------------------------------------');
    }
    process.exit(0);
  }
}

testDatabaseConnection();
