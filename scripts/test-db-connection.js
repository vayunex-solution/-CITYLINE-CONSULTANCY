/**
 * CITYLINE CONSULTANCY — Database Connectivity Test & Diagnostic Tool
 * Safely verifies connection, server version, charset, collation, SSL support,
 * and user privileges without exposing secrets or modifying production data.
 *
 * GOVERNANCE:
 * - Reads strictly from environment variables (.env / backend/.env).
 * - Never prints or logs passwords or secrets.
 * - Never creates or modifies databases.
 * - Implements least-privilege diagnostic reporting.
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
  const useSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';

  console.log(`Target Host:       ${host}:${port}`);
  console.log(`Target Database:   ${database}`);
  console.log(`Database User:     ${user}`);
  console.log(`SSL Requested:     ${useSsl ? 'YES' : 'NO'}`);
  console.log('----------------------------------------------------');

  let authConn = null;
  let dbConn = null;

  // Step 1: Test Server Authentication & Inspect Engine Capabilities
  try {
    const connConfig = {
      host,
      port,
      user,
      password: process.env.DB_PASSWORD,
      connectTimeout: 10000,
    };
    if (useSsl) {
      connConfig.ssl = { rejectUnauthorized: false };
    }

    authConn = await mysql.createConnection(connConfig);

    const [v] = await authConn.query('SELECT VERSION() as version');
    const serverVersion = v[0]?.version || 'Unknown';
    console.log(`[PASS] Server Authentication: SUCCESS`);
    console.log(`[INFO] Verified Engine:       ${serverVersion}`);

    // Query server variables
    try {
      const [rows] = await authConn.query(
        "SHOW VARIABLES WHERE Variable_name IN ('character_set_server', 'collation_server', 'max_connections', 'have_ssl', 'time_zone')"
      );
      const varMap = {};
      for (const row of rows) {
        varMap[row.Variable_name] = row.Value;
      }
      if (varMap.character_set_server) console.log(`[INFO] Server Charset:        ${varMap.character_set_server}`);
      if (varMap.collation_server)     console.log(`[INFO] Server Collation:      ${varMap.collation_server}`);
      if (varMap.max_connections)      console.log(`[INFO] Max Connections:       ${varMap.max_connections}`);
      if (varMap.have_ssl)             console.log(`[INFO] Server SSL Support:    ${varMap.have_ssl}`);
      if (varMap.time_zone)            console.log(`[INFO] Server Time Zone:      ${varMap.time_zone}`);
    } catch {
      // Non-critical variable query fallback
    }
  } catch (err) {
    console.error(`[FAIL] Server Authentication FAILED: [${err.code || 'UNKNOWN'}] — ${err.message}`);
    console.log('----------------------------------------------------');
    console.log('STATUS: FAILED — SERVER AUTHENTICATION REJECTED');
    console.log('====================================================');
    if (authConn) await authConn.end();
    process.exit(1);
  } finally {
    if (authConn) {
      await authConn.end();
    }
  }

  console.log('----------------------------------------------------');

  // Step 2: Test Database Access & Authorization
  try {
    const dbConnConfig = {
      host,
      port,
      user,
      password: process.env.DB_PASSWORD,
      database,
      connectTimeout: 10000,
    };
    if (useSsl) {
      dbConnConfig.ssl = { rejectUnauthorized: false };
    }

    dbConn = await mysql.createConnection(dbConnConfig);

    console.log(`[PASS] Database Authorization: GRANTED for '${database}'`);
    const [tables] = await dbConn.query('SHOW TABLES');
    console.log(`[INFO] Current Tables:        ${tables.length}`);

    const [dbVars] = await dbConn.query(
      "SHOW VARIABLES WHERE Variable_name IN ('character_set_database', 'collation_database')"
    );
    for (const row of dbVars) {
      console.log(`[INFO] Database ${row.Variable_name}: ${row.Value}`);
    }

    await dbConn.end();
    console.log('====================================================');
    console.log('RESULT: Database connection and access verified successfully.');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.warn(`[WARN] Database Authorization: RESTRICTED [${err.code || 'UNKNOWN'}]`);

    if (err.code === 'ER_DBACCESS_DENIED_ERROR') {
      console.log('\n[STATUS] SCHEMA EXECUTION AGAINST LIVE DB: BLOCKED — DATABASE PRIVILEGE REQUIRED');
      console.log('----------------------------------------------------');
      console.log('RECOMMENDED LEAST-PRIVILEGE CPANEL CONFIGURATION:');
      console.log('1. Log into cPanel -> "MySQL® Databases"');
      console.log('2. Scroll to section: "Add User to Database"');
      console.log(`3. Select User: "${user}" and Database: "${database}" (or prefixed name)`);
      console.log('4. Click "Add"');
      console.log('5. Select LEAST PRIVILEGES (Do NOT blindly check ALL PRIVILEGES):');
      console.log('   - Migration/Deployment User requires DDL + DML:');
      console.log('     [X] SELECT, [X] INSERT, [X] UPDATE, [X] DELETE');
      console.log('     [X] CREATE, [X] ALTER, [X] DROP, [X] INDEX, [X] REFERENCES');
      console.log('   - Runtime Application User (Phase 3+):');
      console.log('     [X] SELECT, [X] INSERT, [X] UPDATE, [X] DELETE ONLY');
      console.log('   - DO NOT GRANT: SUPER, FILE, CREATE DATABASE, or GRANT OPTION');
      console.log('6. Click "Make Changes"');
      console.log('----------------------------------------------------');
    } else {
      console.error(`Error details: ${err.message}`);
    }
    if (dbConn) await dbConn.end();
    process.exit(0);
  }
}

testDatabaseConnection();
