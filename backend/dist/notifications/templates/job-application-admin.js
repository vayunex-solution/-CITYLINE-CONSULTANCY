"use strict";
/**
 * CITYLINE CONSULTANCY — Admin Job Application Notification Template
 * Generates branded HTML and plain-text email alerts for recruitment operations
 * upon receipt of a new candidate job application.
 *
 * GOVERNANCE:
 * - Candidate CVs/resumes are strictly stored outside the webroot and NEVER attached as email files.
 * - Private storage paths and keys are strictly withheld.
 * - Recruitment coordinators are instructed to inspect candidate files via the authenticated portal.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderJobApplicationAdminNotification = renderJobApplicationAdminNotification;
const base_layout_1 = require("./base.layout");
function renderJobApplicationAdminNotification(data) {
    const subject = `[Recruitment Lead] New Application — ${data.reference} (${data.jobTitle})`;
    const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; padding: 4px 10px; background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 600; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        New Candidate Application
      </span>
      <h2 style="margin: 12px 0 4px 0; font-size: 18px; color: #0B192C; font-weight: 700;">
        Candidate Profile Submitted for ${(0, base_layout_1.escapeHtml)(data.jobTitle)}
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748B;">
        A candidate profile has been registered through the Cityline Consultancy recruitment portal.
      </p>
    </div>

    <!-- Application Details Card -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; background-color: #F8FAFC;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; width: 35%; font-size: 13px; font-weight: 600; color: #475569;">
          Application Reference
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: 700; color: #0B192C; font-family: monospace;">
          ${(0, base_layout_1.escapeHtml)(data.reference)}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Target Vacancy
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          <strong>${(0, base_layout_1.escapeHtml)(data.jobTitle)}</strong> (${(0, base_layout_1.escapeHtml)(data.jobCategory)})
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Candidate Full Name
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${(0, base_layout_1.escapeHtml)(data.applicantName)}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Email Address
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          <a href="mailto:${(0, base_layout_1.escapeHtml)(data.email)}" style="color: #0284C7; text-decoration: none;">${(0, base_layout_1.escapeHtml)(data.email)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Contact Telephone
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          <a href="tel:${(0, base_layout_1.escapeHtml)(data.phone)}" style="color: #0284C7; text-decoration: none;">${(0, base_layout_1.escapeHtml)(data.phone)}</a>
          ${data.whatsapp ? `<br><span style="font-size: 12px; color: #64748B;">WhatsApp: ${(0, base_layout_1.escapeHtml)(data.whatsapp)}</span>` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Nationality & Location
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${(0, base_layout_1.escapeHtml)(data.nationality)} • Current: ${(0, base_layout_1.escapeHtml)(data.currentLocation)}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          Trade Experience
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${data.yearsExperience} Year(s) verified practical experience
        </td>
      </tr>
      ${data.qualification
        ? `<tr>
              <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
                Qualification
              </td>
              <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
                ${(0, base_layout_1.escapeHtml)(data.qualification)}
              </td>
            </tr>`
        : ''}
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #475569;">
          CV / Resume Uploaded
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #1E293B;">
          ${data.hasCv
        ? '<span style="color: #16A34A; font-weight: 600;">✓ CV Received (Quarantined in Secure Storage)</span>'
        : '<span style="color: #64748B;">No CV attached</span>'}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #475569;">
          Submission Timestamp
        </td>
        <td style="padding: 12px 16px; font-size: 13px; color: #64748B;">
          ${(0, base_layout_1.escapeHtml)(data.submittedAt)}
        </td>
      </tr>
    </table>

    ${data.coverLetter
        ? `<div style="margin-bottom: 24px; padding: 16px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px;">
            <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #475569; text-transform: uppercase;">Candidate Summary / Notes:</h4>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1E293B; white-space: pre-wrap;">${(0, base_layout_1.escapeHtml)(data.coverLetter)}</p>
          </div>`
        : ''}

    <!-- Security Advisory Notice -->
    <div style="padding: 16px; background-color: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #1E40AF;">
        <strong>Document Privacy Notice:</strong> In compliance with security standards, applicant CVs and credentials are kept in isolated physical storage outside the webroot and are never sent as email attachments. Log in to the administrative portal to review full candidate documents.
      </p>
    </div>
  `;
    const html = (0, base_layout_1.renderEmailLayout)({
        title: `New Candidate Application: ${data.reference}`,
        preheader: `Application for ${data.jobTitle} from ${data.applicantName} (${data.reference})`,
        contentHtml,
        footerNote: 'Cityline Consultancy Automated Recruitment Notification System',
    });
    const text = `
CITYLINE CONSULTANCY — NEW CANDIDATE APPLICATION
==================================================

Application Reference: ${data.reference}
Target Vacancy:       ${data.jobTitle} (${data.jobCategory})
Candidate Name:       ${data.applicantName}
Email:                ${data.email}
Phone:                ${data.phone}${data.whatsapp ? ` (WhatsApp: ${data.whatsapp})` : ''}
Nationality:          ${data.nationality}
Current Location:     ${data.currentLocation}
Trade Experience:     ${data.yearsExperience} Year(s)
Qualification:        ${data.qualification || 'Not specified'}
CV Document:          ${data.hasCv ? 'Yes (Stored in secure storage)' : 'None'}
Submitted At:         ${data.submittedAt}

${data.coverLetter ? `CANDIDATE NOTES:\n${data.coverLetter}\n` : ''}

SECURITY NOTICE:
Candidate documents are preserved securely in protected storage and never transmitted over unencrypted email attachments. Inspect candidate records via the authenticated portal.
`.trim();
    return { subject, html, text };
}
