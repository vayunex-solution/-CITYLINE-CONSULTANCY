"use strict";
/**
 * CITYLINE CONSULTANCY — Admin Visa Enquiry Notification Template
 * Generates branded HTML and plain-text email alerts for administrative personnel
 * upon receipt of a new public visa enquiry.
 *
 * GOVERNANCE:
 * - Documents are NEVER attached as email files.
 * - Private storage keys and database credentials are NEVER exposed.
 * - Administrative personnel are directed to the secure admin interface to inspect documents.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderVisaAdminNotification = renderVisaAdminNotification;
const base_layout_1 = require("./base.layout");
function renderVisaAdminNotification(data) {
    const subject = `[Action Required] New Visa Enquiry — ${data.reference} (${data.serviceTitle})`;
    const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; padding: 4px 10px; background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 600; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        New Lead Submission
      </span>
      <h2 style="margin: 12px 0 4px 0; font-size: 18px; color: #0B192C; font-weight: 700;">
        New Visa Advisory Enquiry Received
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748B;">
        A customer has submitted a visa advisory request through the official website.
      </p>
    </div>

    <!-- Details Card -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; background-color: #F8FAFC;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; width: 35%; font-size: 13px; font-weight: 600; color: #475569;">
          Reference ID
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: 700; color: #0B192C;">
          ${(0, base_layout_1.escapeHtml)(data.reference)}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Visa Service
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: 600; color: #1E293B;">
          ${(0, base_layout_1.escapeHtml)(data.serviceTitle)}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Applicant Name
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${(0, base_layout_1.escapeHtml)(data.fullName)}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Email Address
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          <a href="mailto:${(0, base_layout_1.escapeHtml)(data.email)}" style="color: #0B192C; text-decoration: underline;">
            ${(0, base_layout_1.escapeHtml)(data.email)}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Phone / WhatsApp
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${(0, base_layout_1.escapeHtml)(data.phone)} ${data.whatsapp ? `(WhatsApp: ${(0, base_layout_1.escapeHtml)(data.whatsapp)})` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Nationality
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${(0, base_layout_1.escapeHtml)(data.nationality || 'Not specified')}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Applicant Count
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${data.applicantCount} applicant(s)
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Intended Timeline
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${(0, base_layout_1.escapeHtml)(data.timeline || 'Standard processing')}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Secure Documents
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${data.documentsCount > 0
        ? `<span style="color: #059669; font-weight: 600;">✓ ${data.documentsCount} document(s) uploaded</span> (quarantined in secure private storage)`
        : '<span style="color: #64748B;">None provided</span>'}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #475569;">
          Submission Time
        </td>
        <td style="padding: 12px 16px; font-size: 13px; color: #64748B;">
          ${(0, base_layout_1.escapeHtml)(data.submittedAt)}
        </td>
      </tr>
    </table>

    ${data.details
        ? `
      <div style="margin-bottom: 24px; padding: 16px; background-color: #F8FAFC; border-left: 4px solid #C5A880; border-radius: 4px;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase;">
          Applicant Notes / Message
        </h3>
        <p style="margin: 0; font-size: 14px; color: #1E293B; white-space: pre-wrap;">
          ${(0, base_layout_1.escapeHtml)(data.details)}
        </p>
      </div>`
        : ''}

    <!-- Security & Access Note -->
    <div style="padding: 12px 16px; background-color: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 6px; font-size: 13px; color: #1E40AF; line-height: 1.5;">
      <strong>Security Notice:</strong> In accordance with UAE data privacy standards, uploaded identity documents and passport copies are not transmitted via email. Authorised staff may access quarantined documents through the authenticated Cityline Consultancy administrative portal.
    </div>
  `;
    const html = (0, base_layout_1.renderEmailLayout)({
        title: subject,
        preheader: `New visa lead submitted: ${data.fullName} (${data.serviceTitle}) - Ref: ${data.reference}`,
        contentHtml,
        footerNote: 'Internal Administrative Notification • Confidential',
    });
    const text = [
        '==================================================',
        'CITYLINE CONSULTANCY — INTERNAL LEAD NOTIFICATION',
        '==================================================',
        '',
        `ACTION REQUIRED: New Visa Enquiry Received`,
        `Reference ID:    ${data.reference}`,
        `Service:         ${data.serviceTitle}`,
        `Applicant Name:  ${data.fullName}`,
        `Email:           ${data.email}`,
        `Phone:           ${data.phone}${data.whatsapp ? ` (WhatsApp: ${data.whatsapp})` : ''}`,
        `Nationality:     ${data.nationality || 'Not specified'}`,
        `Applicants:      ${data.applicantCount}`,
        `Timeline:        ${data.timeline || 'Standard processing'}`,
        `Documents:       ${data.documentsCount} document(s) uploaded (stored in private storage)`,
        `Submitted:       ${data.submittedAt}`,
        '',
        data.details ? `Notes:\n${data.details}\n` : '',
        'SECURITY NOTICE:',
        'Identity documents are not attached to this email. Please review the documents via the secure administrative portal.',
        '',
        '--------------------------------------------------',
        'Cityline Consultancy LLC • Dubai, UAE',
    ].join('\n');
    return { subject, html, text };
}
