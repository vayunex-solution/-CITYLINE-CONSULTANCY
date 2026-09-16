"use strict";
/**
 * CITYLINE CONSULTANCY — Employer Manpower Enquiry Confirmation Template
 * Generates neutral HTML and plain-text acknowledgement emails for employers
 * confirming receipt of their manpower requisition.
 *
 * GOVERNANCE:
 * - Strictly neutral acknowledgement without implied guarantees.
 * - Zero claims regarding candidate availability, trade testing schedules, or deployment timelines.
 * - Zero attachments and zero sensitive internal paths or keys.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderManpowerEnquiryConfirmation = renderManpowerEnquiryConfirmation;
const base_layout_1 = require("./base.layout");
function renderManpowerEnquiryConfirmation(data) {
    const subject = `Manpower Requirement Received — ${data.reference}`;
    const contentHtml = `
    <div style="margin-bottom: 24px;">
      <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #0B192C; font-weight: 700;">
        Manpower Requirement Received
      </h2>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
        Dear ${(0, base_layout_1.escapeHtml)(data.contactPerson)},
      </p>
      <p style="margin: 12px 0 0 0; font-size: 14px; color: #475569; line-height: 1.6;">
        Thank you for submitting your manpower requirement for <strong>${(0, base_layout_1.escapeHtml)(data.companyName)}</strong> to Cityline Consultancy.
      </p>
    </div>

    <!-- Acknowledgement Card -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; background-color: #F8FAFC;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; width: 40%; font-size: 13px; font-weight: 600; color: #475569;">
          Requisition Reference
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: 700; color: #0B192C; font-family: monospace;">
          ${(0, base_layout_1.escapeHtml)(data.reference)}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Company Name
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0B192C; font-weight: 600;">
          ${(0, base_layout_1.escapeHtml)(data.companyName)}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Requisition Scope
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0B192C;">
          ${data.rolesCount} role(s) / ${data.totalHeadcount} total personnel
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #475569;">
          Submission Date
        </td>
        <td style="padding: 12px 16px; font-size: 13px; color: #0B192C;">
          ${(0, base_layout_1.escapeHtml)(data.submittedAt)}
        </td>
      </tr>
    </table>

    <!-- Neutral Next Steps -->
    <div style="padding: 16px; background-color: #F1F5F9; border-left: 3px solid #64748B; border-radius: 4px; margin-bottom: 24px;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1E293B; text-transform: uppercase; letter-spacing: 0.5px;">
        Next Steps
      </h4>
      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
        Your requirement has been received and will be reviewed by our corporate advisory team. A representative may contact your organization if additional clarification or technical trade specifications are required.
      </p>
    </div>

    <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.5;">
      Please retain your requisition reference (<strong>${(0, base_layout_1.escapeHtml)(data.reference)}</strong>) for any future correspondence regarding this enquiry.
    </p>
  `;
    const html = (0, base_layout_1.renderEmailLayout)({
        title: 'Manpower Requirement Received',
        preheader: `Acknowledgement for requisition ${data.reference} — Cityline Consultancy`,
        contentHtml,
    });
    const text = `
CITYLINE CONSULTANCY — MANPOWER REQUIREMENT RECEIVED
=====================================================

Dear ${data.contactPerson},

Thank you for submitting your manpower requirement for ${data.companyName} to Cityline Consultancy.

Requisition Reference: ${data.reference}
Company Name: ${data.companyName}
Requisition Scope: ${data.rolesCount} role(s) / ${data.totalHeadcount} total personnel
Submission Date: ${data.submittedAt}

NEXT STEPS:
Your requirement has been received and will be reviewed by our corporate advisory team. A representative may contact your organization if additional clarification or technical trade specifications are required.

Please retain your reference number (${data.reference}) for all correspondence.
  `.trim();
    return { subject, html, text };
}
