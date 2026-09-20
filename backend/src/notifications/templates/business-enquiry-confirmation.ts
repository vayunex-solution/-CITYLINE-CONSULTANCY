/**
 * CITYLINE CONSULTANCY — Customer Business & Contact Enquiry Confirmation Template
 * Generates branded acknowledgment emails for customers who submit an enquiry through the website.
 */

import { renderEmailLayout, escapeHtml } from './base.layout';

export interface BusinessEnquiryConfirmationData {
  reference: string;
  fullName: string;
  service: string;
  documentsCount: number;
}

export function renderBusinessEnquiryConfirmation(data: BusinessEnquiryConfirmationData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Enquiry Acknowledged: Consultation Reference ${data.reference} — Cityline Consultancy`;

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0B192C; font-weight: 700;">
        Dear ${escapeHtml(data.fullName)},
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
        Thank you for reaching out to <strong>Cityline Consultancy</strong>. We have successfully received your enquiry regarding <strong>${escapeHtml(data.service)}</strong>.
      </p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Our corporate advisory specialists have logged your requirements and will connect with you shortly via email or WhatsApp.
      </p>
    </div>

    <!-- Reference Box -->
    <div style="margin-bottom: 24px; padding: 20px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; text-align: center;">
      <span style="font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Consultation Reference Number
      </span>
      <div style="margin: 8px 0; font-size: 22px; font-weight: 800; color: #0B192C; letter-spacing: 1.5px; font-family: 'Courier New', Courier, monospace;">
        ${escapeHtml(data.reference)}
      </div>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B;">
        Please keep this reference code for all communications with our advisory team.
      </p>
    </div>

    <!-- Summary of Enquiry -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">
      <tr style="background-color: #F8FAFC;">
        <th colspan="2" style="padding: 10px 16px; text-align: left; font-size: 13px; font-weight: 600; color: #0B192C; border-bottom: 1px solid #E2E8F0;">
          Summary of Submitted Details
        </th>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; width: 40%; font-size: 13px; color: #64748B;">
          Service Category
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #1E293B;">
          ${escapeHtml(data.service)}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; font-size: 13px; color: #64748B;">
          Supporting Files
        </td>
        <td style="padding: 10px 16px; font-size: 13px; color: #1E293B;">
          ${data.documentsCount > 0 ? `${data.documentsCount} file(s) securely uploaded` : 'None uploaded'}
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
      If you have immediate questions, you may contact our Dubai operations office or email us at
      <a href="mailto:info@citylineconsultancy.com" style="color: #0B192C; font-weight: 600;">info@citylineconsultancy.com</a>.
    </p>
  `;

  const html = renderEmailLayout({
    title: `Consultation Enquiry Acknowledged — ${data.reference}`,
    preheader: `Thank you for contacting Cityline Consultancy — Reference: ${data.reference}`,
    contentHtml,
  });

  const text = `
CITYLINE CONSULTANCY — CONSULTATION ENQUIRY ACKNOWLEDGMENT
========================================================

Dear ${data.fullName},

Thank you for contacting Cityline Consultancy. We have received your enquiry regarding: ${data.service}.

YOUR REFERENCE NUMBER:
${data.reference}

Our advisory specialists are reviewing your request and will follow up with you promptly.

========================================================
Cityline Consultancy
Dubai, United Arab Emirates
Email: info@citylineconsultancy.com
Web: https://citylineconsultancy.com
  `.trim();

  return { subject, html, text };
}
