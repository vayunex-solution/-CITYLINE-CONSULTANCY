/**
 * Test script to verify Admin Settings Service and Controller
 */

import { appSettingService } from '../src/services/app-setting.service';
import { getDbClient } from '../src/database/connection';

async function testSettings() {
  console.log('Testing AppSettingService...');

  // 1. Read email
  const email1 = await appSettingService.getAdminNotificationEmail();
  console.log('Current email:', email1);

  // 2. Update email to test persistence
  await appSettingService.setAdminNotificationEmail('yashkr4748@gmail.com');
  const email2 = await appSettingService.getAdminNotificationEmail();
  console.log('Updated email:', email2);

  // 3. Check DB
  const db = getDbClient();
  const row = await db('app_settings').where({ setting_key: 'admin_notification_email' }).first();
  console.log('DB value:', row);

  await db.destroy();
  console.log('Settings verification passed!');
}

testSettings().catch(console.error);
