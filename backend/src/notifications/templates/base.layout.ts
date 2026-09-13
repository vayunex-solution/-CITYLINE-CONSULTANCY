/**
 * CITYLINE CONSULTANCY — Base Email Layout & Renderer
 * Provides a responsive, accessible, branded HTML template container
 * with automated plain-text fallback generation.
 *
 * Brand Palette:
 * - Brand Dark: #0B192C (Deep Navy)
 * - Brand Accent: #C5A880 (Dubai Sand / Gold)
 * - Background: #F4F6F8 (Clean Off-White)
 * - Card Background: #FFFFFF
 * - Text Primary: #1E293B (Slate 800)
 * - Text Muted: #64748B (Slate 500)
 * - Border: #E2E8F0 (Slate 200)
 */

export interface EmailLayoutOptions {
  title: string;
  preheader?: string;
  contentHtml: string;
  footerNote?: string;
}

/**
 * Escapes HTML characters to prevent XSS / HTML injection in generated emails.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Wraps content in the branded Cityline Consultancy HTML shell.
 */
export function renderEmailLayout(options: EmailLayoutOptions): string {
  const preheaderText = options.preheader
    ? `<span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(options.preheader)}</span>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(options.title)}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #F4F6F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .content-cell { padding: 24px 16px !important; }
      .header-cell { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F8; color: #1E293B;">
  ${preheaderText}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F6F8;">
    <tr>
      <td align="center" style="padding: 24px 12px 36px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
          <!-- Header -->
          <tr>
            <td class="header-cell" style="background-color: #0B192C; padding: 28px 32px; border-bottom: 3px solid #C5A880; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase;">
                      CITYLINE CONSULTANCY
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #C5A880; font-weight: 500; letter-spacing: 0.25px;">
                      Business Setup &amp; Visa Advisory Services • Dubai, UAE
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-cell" style="padding: 32px; font-size: 15px; line-height: 1.6; color: #1E293B;">
              ${options.contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
                <strong>Cityline Consultancy LLC</strong> • Al Rigga, Deira, Dubai, United Arab Emirates
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94A3B8; line-height: 1.4;">
                ${options.footerNote ? escapeHtml(options.footerNote) + '<br>' : ''}
                This is an automated transactional notification. Please do not reply directly to this email address.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
