const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load .env relative to script and cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const recipient = process.argv[2] || 'yashkr4748@gmail.com';
const host = process.env.SMTP_HOST || 'mail.citylineconsultancy.com';
const port = parseInt(process.env.SMTP_PORT || '465', 10);
const secure = process.env.SMTP_SECURE === 'true' || port === 465;
const user = process.env.SMTP_USER || 'no-reply@citylineconsultancy.com';
const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'cityline00725';
const from = process.env.SMTP_FROM || `"Cityline Consultancy" <${user}>`;

console.log('====================================================');
console.log('CITYLINE CONSULTANCY — SMTP Diagnostic Test');
console.log('====================================================');
console.log(`Connecting to: ${host}:${port} (SSL/TLS: ${secure})`);
console.log(`Authenticating as: ${user}`);
console.log(`Recipient: ${recipient}`);
console.log('----------------------------------------------------');

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
});

async function sendTest() {
  try {
    console.log('Verifying SMTP connection credentials...');
    await transporter.verify();
    console.log('[PASS] SMTP handshake & authentication verified successfully!');

    console.log(`Sending live test email to: ${recipient}...`);
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: 'Cityline Consultancy — SMTP Verification Test',
      text: `Hello,\n\nThis is a verified live SMTP test from Cityline Consultancy production backend.\n\nSent at: ${new Date().toISOString()}\nServer: ${host}\nSender: ${from}\nStatus: Active & Operational\n\nBest Regards,\nCityline Technical Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #b3871b; margin-top: 0;">Cityline Consultancy — SMTP Live Verification</h2>
          <p>Hello,</p>
          <p>This is a verified test email sent from the <strong>Cityline Consultancy</strong> production backend server.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #b3871b; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
            <p style="margin: 4px 0;"><strong>SMTP Server:</strong> ${host}:${port}</p>
            <p style="margin: 4px 0;"><strong>Sender:</strong> ${from}</p>
            <p style="margin: 4px 0;"><strong>Recipient:</strong> ${recipient}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> Verified & Fully Functional</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">If you received this message, the transactional notification engine is fully operating.</p>
        </div>
      `,
    });

    console.log('====================================================');
    console.log('[PASS] Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('====================================================');
    console.error('[FAIL] SMTP Test Failed:', err.message);
    if (err.code) console.error('Error Code:', err.code);
    if (err.command) console.error('SMTP Command:', err.command);
    console.error('====================================================');
    process.exit(1);
  }
}

sendTest();
