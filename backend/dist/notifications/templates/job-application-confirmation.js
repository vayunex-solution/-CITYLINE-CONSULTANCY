"use strict";
/**
 * CITYLINE CONSULTANCY — Candidate Job Application Confirmation Template
 * Generates branded HTML and plain-text acknowledgment emails for candidates
 * who apply for an open job vacancy through the website.
 *
 * COMPLIANCE & GOVERNANCE RULES:
 * - Acknowledges receipt of candidate application.
 * - Displays unique public reference ID (CLC-J-YYYY-XXXXXXXX).
 * - Identifies target vacancy title and category.
 * - STRICTLY NO promises or guarantees (no guaranteed placement, no guaranteed visa, no selection promises).
 * - STRICTLY NO recruitment fee or pricing claims.
 * - CV files are NEVER attached to outbound confirmation emails.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderJobApplicationConfirmation = renderJobApplicationConfirmation;
const base_layout_1 = require("./base.layout");
function renderJobApplicationConfirmation(data) {
    const subject = `Application Acknowledged: ${data.jobTitle} (Ref: ${data.reference}) — Cityline Consultancy`;
    const contentHtml = `
    <div style="margin-bottom: 24px;">
      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0B192C; font-weight: 700;">
        Dear ${(0, base_layout_1.escapeHtml)(data.applicantName)},
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
        Thank you for submitting your candidate profile to <strong>Cityline Consultancy</strong>. Your application for the position of <strong>${(0, base_layout_1.escapeHtml)(data.jobTitle)}</strong> (${(0, base_layout_1.escapeHtml)(data.jobCategory)}) has been registered with our recruitment operations team.
      </p>
    </div>

    <!-- Reference Box -->
    <div style="margin-bottom: 24px; padding: 20px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; text-align: center;">
      <span style="font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Application Reference Number
      </span>
      <div style="margin: 8px 0; font-size: 22px; font-weight: 800; color: #0B192C; letter-spacing: 1.5px; font-family: 'Courier New', Courier, monospace;">
        ${(0, base_layout_1.escapeHtml)(data.reference)}
      </div>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B;">
        Please quote this reference in all correspondence regarding this vacancy.
      </p>
    </div>

    <!-- Application Summary -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; background-color: #FFFFFF;">
      <tr style="background-color: #0B192C;">
        <td colspan="2" style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #FFFFFF;">
          Application Summary
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; width: 40%; font-size: 13px; color: #64748B;">Position Applied For</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #1E293B;">${(0, base_layout_1.escapeHtml)(data.jobTitle)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B;">Trade Category</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B;">${(0, base_layout_1.escapeHtml)(data.jobCategory)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; font-size: 13px; color: #64748B;">Resume / CV Status</td>
        <td style="padding: 10px 16px; font-size: 13px; color: #1E293B;">${data.hasCv ? '✓ Successfully uploaded to secure repository' : 'Not attached'}</td>
      </tr>
    </table>

    <!-- Transparent Advisory Notice -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #0B192C; font-weight: 600;">
        Recruitment Screening Process:
      </h3>
      <ol style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #334155;">
        <li style="margin-bottom: 8px;">
          <strong>Credential & Trade Screening:</strong> Our technical recruitment team reviews candidate trade qualifications and practical background against UAE employer criteria.
        </li>
        <li style="margin-bottom: 8px;">
          <strong>Pre-Screening Contact:</strong> If your profile aligns with active employer requirements, a coordinator will reach out to verify trade documentation and schedule trade assessments.
        </li>
        <li style="margin-bottom: 8px;">
          <strong>Formal Employer Review:</strong> Final selection, interviews, and official offer issuance remain at the sole discretion of verified UAE employers.
        </li>
      </ol>
    </div>

    <!-- Truth in Recruitment Disclosure -->
    <div style="padding: 16px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; margin-bottom: 20px;">
      <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        Regulatory & Ethical Recruitment Notice
      </h4>
      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748B;">
        Cityline Consultancy operates in strict adherence to UAE Ministry of Human Resources and Emiratisation (MOHRE) guidelines and international ethical recruitment principles. Submission of an application does not constitute an employment contract or guaranteed job placement. All candidate documentation is handled in strict compliance with data privacy regulations.
      </p>
    </div>
  `;
    const html = (0, base_layout_1.renderEmailLayout)({
        title: `Application Acknowledged — ${data.reference}`,
        preheader: `Thank you for applying for ${data.jobTitle}. Your application reference is ${data.reference}.`,
        contentHtml,
        footerNote: 'Cityline Consultancy — Authorized UAE Employment & Corporate Services Advisory',
    });
    const text = `
CITYLINE CONSULTANCY — CANDIDATE APPLICATION ACKNOWLEDGMENT
============================================================

Dear ${data.applicantName},

Thank you for submitting your profile for:
Position: ${data.jobTitle} (${data.jobCategory})
Application Reference: ${data.reference}

Your application has been registered with our recruitment operations team.
Please quote this reference in all correspondence.

WHAT HAPPENS NEXT:
1. Trade Screening: Our recruitment team reviews candidate trade qualifications and background.
2. Pre-Screening: If your qualifications match active requirements, a coordinator will contact you.
3. Formal Review: Final selection and interviews are conducted directly with verified UAE employers.

DISCLOSURE & ETHICAL STANDARDS:
Cityline Consultancy operates in accordance with UAE Ministry of Human Resources and Emiratisation (MOHRE) standards. Application submission does not guarantee selection or placement. Candidate records are handled securely in accordance with strict privacy protocols.
`.trim();
    return { subject, html, text };
}
