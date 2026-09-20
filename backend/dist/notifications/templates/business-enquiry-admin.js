"use strict";
/**
 * CITYLINE CONSULTANCY — Admin Business Setup & Contact Enquiry Notification Template
 * Generates branded HTML and plain-text email alerts for administrative personnel
 * upon receipt of a new contact form or corporate consultation enquiry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderBusinessEnquiryAdminNotification = renderBusinessEnquiryAdminNotification;
const base_layout_1 = require("./base.layout");
function renderBusinessEnquiryAdminNotification(data) {
    const subject = `[Website Enquiry] New Consultation Request — ${data.reference} (${data.service})`;
    const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; padding: 4px 10px; background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 600; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        New Contact Lead
      </span>
      <h2 style="margin: 12px 0 4px 0; font-size: 18px; color: #0B192C; font-weight: 700;">
        New Consultation Enquiry Received
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748B;">
        A customer has submitted a consultation enquiry through the main website contact form.
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
          Service Category
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: 600; color: #1E293B;">
          ${(0, base_layout_1.escapeHtml)(data.service)}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Sender Name
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
          Phone / Contact
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${(0, base_layout_1.escapeHtml)(data.phone)} ${data.whatsapp ? `(WhatsApp: ${(0, base_layout_1.escapeHtml)(data.whatsapp)})` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Attached Documents
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${data.documentsCount > 0
        ? `<strong style="color: #10B981;">✓ ${data.documentsCount} document(s) attached to this email</strong>${data.documentNames && data.documentNames.length > 0
            ? ` <span style="font-size: 12px; color: #64748B;">(${(0, base_layout_1.escapeHtml)(data.documentNames.join(', '))})</span>`
            : ''}`
        : 'None provided'}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #475569;">
          Submission Time
        </td>
        <td style="padding: 12px 16px; font-size: 14px; color: #64748B;">
          ${(0, base_layout_1.escapeHtml)(data.submittedAt)}
        </td>
      </tr>
    </table>

    <!-- Message Content -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0B192C; font-weight: 600;">
        Message / Project Requirements:
      </h3>
      <div style="padding: 16px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">
        ${(0, base_layout_1.escapeHtml)(data.message)}
      </div>
    </div>

    <!-- Administrative Action Box -->
    <div style="padding: 16px; background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px;">
      <p style="margin: 0; font-size: 13px; color: #1E40AF; line-height: 1.5;">
        <strong>Quick Action:</strong> Click the applicant's email address above to reply directly, or review any attached PDFs/documents included with this dispatch.
      </p>
    </div>
  `;
    const html = (0, base_layout_1.renderEmailLayout)({
        title: `New Consultation Enquiry: ${data.service}`,
        preheader: `New consultation lead: ${data.fullName} — ${data.service} (${data.reference})`,
        contentHtml,
    });
    const text = `
CITYLINE CONSULTANCY — NEW CONSULTATION ENQUIRY
========================================================

Reference ID:      ${data.reference}
Submission Time:   ${data.submittedAt}
Service Category:  ${data.service}

APPLICANT DETAILS:
Name:              ${data.fullName}
Email:             ${data.email}
Phone:             ${data.phone}
WhatsApp:          ${data.whatsapp || 'N/A'}
Attached Files:    ${data.documentsCount} file(s) attached directly to this email

MESSAGE / REQUIREMENTS:
${data.message}

========================================================
This is an automated administrative notification dispatched by Cityline Consultancy Operational Systems.
  `.trim();
    return { subject, html, text };
}
