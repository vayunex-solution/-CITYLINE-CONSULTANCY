/**
 * CITYLINE CONSULTANCY — Admin Manpower Enquiry Notification Template
 * Generates branded HTML and plain-text email alerts for corporate recruitment operations
 * upon receipt of a new employer manpower requisition.
 *
 * GOVERNANCE:
 * - Strictly zero file attachments.
 * - Zero internal database IDs, primary keys, or server filesystem paths exposed.
 * - Concise summary of company details, contact person, and requested roles.
 */

import { renderEmailLayout, escapeHtml } from './base.layout';

export interface ManpowerPositionSummary {
  categorySlug: string;
  roleTitle: string;
  headcount: number;
  experienceYearsRequired?: number | null;
  qualification?: string | null;
  genderRequirement?: string | null;
  languageRequirements?: string | null;
  salaryOffered?: string | null;
  accommodationProvided?: string | null;
  transportProvided?: string | null;
  foodProvided?: string | null;
  notes?: string | null;
}

export interface ManpowerEnquiryAdminNotificationData {
  reference: string;
  companyName: string;
  contactPerson: string;
  contactDesignation?: string | null;
  email: string;
  phone: string;
  whatsapp?: string | null;
  city: string;
  website?: string | null;
  industry?: string | null;
  preferredTimeline?: string | null;
  deploymentLocation?: string | null;
  specialRequirements?: string | null;
  positions: ManpowerPositionSummary[];
  totalHeadcount: number;
  submittedAt: string;
}

export function renderManpowerEnquiryAdminNotification(data: ManpowerEnquiryAdminNotificationData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Manpower Requirement] New Requisition — ${data.reference} (${data.companyName})`;

  const positionsHtml = data.positions
    .map(
      (p, idx) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B;">
          <strong>#${idx + 1}. ${escapeHtml(p.roleTitle)}</strong><br/>
          <span style="font-size: 11px; color: #64748B;">Category: ${escapeHtml(p.categorySlug)}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #1E293B; text-align: center; font-weight: 700;">
          ${p.headcount}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #475569;">
          ${p.experienceYearsRequired ? `${p.experienceYearsRequired} yrs` : 'Not specified'}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #475569;">
          ${[
            p.accommodationProvided ? `Acc: ${p.accommodationProvided}` : null,
            p.transportProvided ? `Trans: ${p.transportProvided}` : null,
            p.foodProvided ? `Food: ${p.foodProvided}` : null,
          ]
            .filter(Boolean)
            .join(' | ') || 'None specified'}
        </td>
      </tr>
    `
    )
    .join('');

  const contentHtml = `
    <div style="margin-bottom: 24px;">
      <span style="display: inline-block; padding: 4px 10px; background-color: #DBEAFE; color: #1E40AF; font-size: 12px; font-weight: 600; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
        New Employer Requisition
      </span>
      <h2 style="margin: 12px 0 4px 0; font-size: 18px; color: #0B192C; font-weight: 700;">
        Manpower Requirement from ${escapeHtml(data.companyName)}
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748B;">
        A new corporate manpower requisition has been submitted through the Cityline Consultancy portal.
      </p>
    </div>

    <!-- Company & Contact Details -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; background-color: #F8FAFC;">
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; width: 35%; font-size: 12px; font-weight: 600; color: #475569;">
          Reference
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 700; color: #0B192C; font-family: monospace;">
          ${escapeHtml(data.reference)}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 600; color: #475569;">
          Company Name
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0B192C; font-weight: 600;">
          ${escapeHtml(data.companyName)}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 600; color: #475569;">
          Contact Person
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0B192C;">
          ${escapeHtml(data.contactPerson)} ${data.contactDesignation ? `(${escapeHtml(data.contactDesignation)})` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 600; color: #475569;">
          Email & Phone
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0B192C;">
          <a href="mailto:${escapeHtml(data.email)}" style="color: #1E40AF; text-decoration: none;">${escapeHtml(data.email)}</a> | ${escapeHtml(data.phone)}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 600; color: #475569;">
          Location / City
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0B192C;">
          ${escapeHtml(data.city)}${data.deploymentLocation ? ` (Deployment: ${escapeHtml(data.deploymentLocation)})` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #475569;">
          Timeline
        </td>
        <td style="padding: 10px 14px; font-size: 13px; color: #0B192C;">
          ${escapeHtml(data.preferredTimeline || 'Standard timeline')}
        </td>
      </tr>
    </table>

    <!-- Positions Breakdown Table -->
    <h3 style="margin: 20px 0 10px 0; font-size: 15px; color: #0B192C; font-weight: 700;">
      Requested Roles (${data.totalHeadcount} Total Personnel)
    </h3>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; background-color: #FFFFFF;">
      <thead>
        <tr style="background-color: #F1F5F9;">
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Role & Category</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; text-align: center; text-transform: uppercase;">Headcount</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Exp.</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Provisions</th>
        </tr>
      </thead>
      <tbody>
        ${positionsHtml}
      </tbody>
    </table>

    ${
      data.specialRequirements
        ? `
      <div style="margin-bottom: 20px; padding: 12px 14px; background-color: #F8FAFC; border-left: 3px solid #3B82F6; border-radius: 4px;">
        <strong style="font-size: 12px; color: #475569; text-transform: uppercase;">Special Requirements:</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #1E293B; line-height: 1.5;">
          ${escapeHtml(data.specialRequirements)}
        </p>
      </div>
    `
        : ''
    }

    <div style="padding: 12px 16px; background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px;">
      <p style="margin: 0; font-size: 12px; color: #92400E; line-height: 1.5;">
        <strong>Advisory Action:</strong> Please review this requirement in the administrative portal and initiate contact with the employer's designated representative.
      </p>
    </div>
  `;

  const html = renderEmailLayout({
    title: 'New Manpower Requirement Received',
    preheader: `New requirement from ${data.companyName} — ${data.reference} (${data.totalHeadcount} personnel)`,
    contentHtml,
  });

  const text = `
CITYLINE CONSULTANCY — NEW MANPOWER REQUIREMENT
==================================================

Reference: ${data.reference}
Company: ${data.companyName}
Contact Person: ${data.contactPerson} ${data.contactDesignation ? `(${data.contactDesignation})` : ''}
Email: ${data.email}
Phone: ${data.phone}
City: ${data.city}
Deployment: ${data.deploymentLocation || 'Not specified'}
Timeline: ${data.preferredTimeline || 'Standard timeline'}
Total Headcount: ${data.totalHeadcount}

ROLES BREAKDOWN:
${data.positions
  .map(
    (p, i) =>
      `#${i + 1} ${p.roleTitle} (Category: ${p.categorySlug}) — Headcount: ${p.headcount}`
  )
  .join('\n')}

Special Requirements: ${data.specialRequirements || 'None specified'}
Submitted At: ${data.submittedAt}
  `.trim();

  return { subject, html, text };
}
