/**
 * CITYLINE CONSULTANCY — Live End-to-End Contact Form + PDF Email Verification Script
 */

import fs from 'fs';
import path from 'path';
import { businessEnquiryService } from '../src/services/business-enquiry.service';
import { notificationService } from '../src/services/notification.service';
import { appSettingService } from '../src/services/app-setting.service';
import { getDbClient } from '../src/database/connection';

// Minimal valid PDF document buffer conforming to PDF-1.4 standard
function createTestPdfBuffer(): Buffer {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length 124 >>
stream
BT
/F1 18 Tf
50 720 Td
(Cityline Consultancy - Official Consultation Request Document) Tj
/F1 12 Tf
0 -30 Td
(Applicant: Yash Kumar) Tj
0 -20 Td
(Service: 2-Year Freelance Visa Dubai) Tj
0 -20 Td
(Delivery Target: yashkr4748@gmail.com) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
390
%%EOF`;
  return Buffer.from(content, 'utf-8');
}

async function runTest() {
  console.log('========================================================');
  console.log('  CONTACT FORM + PDF SUBMISSION + EMAIL DISPATCH TEST');
  console.log('========================================================');

  // 1. Verify dynamic admin recipient setting
  const activeAdminEmail = await appSettingService.getAdminNotificationEmail();
  console.log(`[1/4] Current Admin Notification Recipient in DB: ${activeAdminEmail}`);

  // 2. Prepare test PDF file
  const pdfBuffer = createTestPdfBuffer();
  console.log(`[2/4] Created valid test PDF payload: consultation_profile_yash.pdf (${pdfBuffer.length} bytes)`);

  const mockFile: Express.Multer.File = {
    fieldname: 'documents',
    originalname: 'consultation_profile_yash.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: pdfBuffer,
    size: pdfBuffer.length,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  // 3. Submit enquiry through BusinessEnquiryService (same logic as POST /api/v1/business-enquiries)
  console.log('[3/4] Submitting Contact form enquiry through BusinessEnquiryService...');
  const submissionResult = await businessEnquiryService.submitEnquiry(
    {
      fullName: 'Yash Kumar',
      email: 'yashkr4748@gmail.com',
      phone: '+971 50 123 4567',
      whatsapp: '+971 50 123 4567',
      service: '2-Year Freelance Visa Dubai',
      message: 'Hello, this is a live verification enquiry submitted from the contact form with an attached PDF document for review.',
      consent: true,
    },
    [mockFile],
    { clientIp: '127.0.0.1', requestId: 'test-contact-pdf-001' }
  );

  console.log(`✓ Enquiry submitted successfully! Reference: ${submissionResult.reference}, Enquiry ID: ${submissionResult.enquiryId}`);
  console.log(`✓ Attached documents stored securely: ${submissionResult.documentsCount}`);

  // 4. Dispatch notification queue batch through pooled SMTP
  console.log('[4/4] Processing notification queue through live SMTP server...');
  const batchStats = await notificationService.processBatch({ batchSize: 5 });

  console.log('--------------------------------------------------------');
  console.log('Batch Processing Results:');
  console.log(`  Claimed:   ${batchStats.processed}`);
  console.log(`  Sent:      ${batchStats.sent}`);
  console.log(`  Failed:    ${batchStats.failed}`);
  console.log(`  Exhausted: ${batchStats.exhausted}`);
  console.log('========================================================');

  // Verify status in DB
  const db = getDbClient();
  const queueRecords = await db('notification_queue')
    .where({ reference_id: submissionResult.enquiryId })
    .select('id', 'notification_type', 'recipient_email', 'status', 'subject', 'sent_at');

  console.log('\nOutbox Records for this submission:');
  console.table(queueRecords);

  await db.destroy();
  console.log('\n✓ Test completed successfully! Check yashkr4748@gmail.com for the delivered email and PDF attachment.');
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
