/**
 * CITYLINE CONSULTANCY — Applicant Visa Enquiry Confirmation Template
 * Generates branded HTML and plain-text acknowledgment emails for customers
 * who submit a visa enquiry through the website.
 *
 * COMPLIANCE & GOVERNANCE RULES:
 * - Acknowledges receipt of the enquiry.
 * - Explicitly provides the unique public reference ID.
 * - STRICTLY NO promises or guarantees regarding visa approval or guaranteed outcomes.
 * - STRICTLY NO pricing or fee claims.
 * - Documents submitted are NEVER attached to outbound confirmation emails.
 * - Discloses regulatory authority role (approvals rest with relevant UAE immigration authorities).
 */

import { renderEmailLayout, escapeHtml } from './base.layout';

export interface VisaApplicantConfirmationData {
  reference: string;
  fullName: string;
  serviceTitle: string;
  applicantCount: number;
  documentsCount: number;
}

export function renderVisaApplicantConfirmation(data: VisaApplicantConfirmationData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Enquiry Acknowledged: Visa Application Reference ${data.reference} — Cityline Consultancy`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0B192C; font-weight: 700;">
        Dear ${escapeHtml(data.fullName)},
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
        Thank you for contacting <strong>Cityline Consultancy</strong>. We have received your visa enquiry for <strong>${escapeHtml(data.serviceTitle)}</strong> and our advisory team has initiated preliminary document verification.
      </p>
    </div>

    <!-- Reference Box -->
    <div style="margin-bottom: 24px; padding: 20px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; text-align: center;">
      <span style="font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Enquiry Reference Number
      </span>
      <div style="margin: 8px 0; font-size: 22px; font-weight: 800; color: #0B192C; letter-spacing: 1.5px; font-family: 'Courier New', Courier, monospace;">
        ${escapeHtml(data.reference)}
      </div>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B;">
        Please quote this reference number in all communications with our advisory team.
      </p>
    </div>

    <!-- Summary of Enquiry -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">
      <tr style="background-color: #F8FAFC;">
        <th colspan="2" style="padding: 10px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #0B192C; border-bottom: 1px solid #E2E8F0;">
          Summary of Submitted Request
        </th>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; width: 40%;">
          Visa Category
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #1E293B;">
          ${escapeHtml(data.serviceTitle)}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B;">
          Applicant(s)
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B;">
          ${data.applicantCount} person(s)
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; font-size: 13px; color: #64748B;">
          Uploaded Documents
        </td>
        <td style="padding: 10px 16px; font-size: 13px; color: #1E293B;">
          ${
            data.documentsCount > 0
              ? `${data.documentsCount} document(s) securely received`
              : 'None submitted online'
          }
        </td>
      </tr>
    </table>

    <!-- Next Steps -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0B192C; text-transform: uppercase; letter-spacing: 0.25px;">
        What Happens Next?
      </h3>
      <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #334155;">
        <li style="margin-bottom: 6px;">
          Our certified immigration consultants will review your submission against current UAE immigration regulations.
        </li>
        <li style="margin-bottom: 6px;">
          If any supporting documents require clarification, a consultant will contact you via your provided contact details.
        </li>
        <li>
          A dedicated consultant will reach out to outline formal document clearing and submission procedures.
        </li>
      </ol>
    </div>

    <!-- Regulatory Disclaimer -->
    <div style="padding: 14px 16px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; font-size: 12px; line-height: 1.5; color: #64748B;">
      <strong>Regulatory Notice:</strong> Cityline Consultancy LLC provides corporate services, document clearance, and visa advisory assistance. All visa issuances, entry permits, and residency approvals are subject to the sole discretion and formal approval of the relevant UAE government authorities (GDRFA / ICP).
    </div>
  `;

  const html = renderEmailLayout({
    title: subject,
    preheader: `Enquiry reference ${data.reference} received for ${data.serviceTitle} — Cityline Consultancy`,
    contentHtml,
    footerNote: 'Thank you for choosing Cityline Consultancy.',
  });

  const text = [
    '==================================================',
    'CITYLINE CONSULTANCY — VISA ENQUIRY ACKNOWLEDGMENT',
    '==================================================',
    '',
    `Dear ${data.fullName},`,
    '',
    `Thank you for contacting Cityline Consultancy. We have received your visa enquiry for ${data.serviceTitle}.`,
    '',
    `YOUR REFERENCE NUMBER: ${data.reference}`,
    'Please retain this reference number for all future correspondence.',
    '',
    'SUMMARY OF SUBMITTED DETAILS:',
    `- Visa Service:       ${data.serviceTitle}`,
    `- Applicants:         ${data.applicantCount} person(s)`,
    `- Documents Received: ${data.documentsCount > 0 ? `${data.documentsCount} document(s) securely received` : 'None submitted online'}`,
    '',
    'NEXT STEPS:',
    '1. Our visa advisory team will evaluate your request against applicable UAE immigration guidelines.',
    '2. A consultant will reach out to you via your registered contact details.',
    '',
    'REGULATORY NOTICE:',
    'Cityline Consultancy LLC is a licensed management and document clearing consultancy in Dubai, UAE.',
    'All visa approvals, entry permits, and status changes are subject to the sole authority and review of the GDRFA / ICP.',
    '',
    '--------------------------------------------------',
    'Cityline Consultancy LLC • Al Rigga, Deira, Dubai, UAE',
  ].join('\n');

  return { subject, html, text };
}
