/**
 * CITYLINE CONSULTANCY — Business Setup Enquiry Core Service
 * Coordinates validation, transactional persistence across enquiries and business_setup_enquiries tables,
 * and generates public reference identifiers (CLC-BS-YYYY-XXXXXXXX).
 */

import crypto from 'crypto';
import { withTransaction } from '../database/transaction';
import { BusinessEnquiryInput } from '../schemas/business-enquiry.schema';
import { auditLogRepository, AuditLogRepository } from '../repositories/audit-log.repository';
import { normalizeDatabaseError } from '../database/database-error';

export interface ProcessedBusinessEnquiryResult {
  reference: string;
  enquiryId: string;
  service: string;
}

export class BusinessEnquiryService {
  constructor(private auditRepo: AuditLogRepository = auditLogRepository) {}

  public async submitEnquiry(
    input: BusinessEnquiryInput,
    context: { clientIp?: string; requestId?: string } = {}
  ): Promise<ProcessedBusinessEnquiryResult> {
    const enquiryId = crypto.randomUUID();
    const detailId = crypto.randomUUID();
    const year = new Date().getFullYear();
    const shortCode = enquiryId.replace(/-/g, '').slice(0, 8).toUpperCase();
    const publicReference = `CLC-BS-${year}-${shortCode}`;

    try {
      await withTransaction(async (trx) => {
        // 1. Insert parent enquiry record
        await trx('enquiries').insert({
          id: enquiryId,
          enquiry_type: 'business_setup',
          status: 'new',
          full_name: input.fullName,
          email: input.email,
          phone: input.phone,
          whatsapp: input.whatsapp || null,
          subject: `Business Setup: ${input.service}`,
          message: input.message,
          source_channel: 'website',
          assigned_admin_id: null,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        });

        // 2. Insert business_setup_enquiries detail record
        await trx('business_setup_enquiries').insert({
          id: detailId,
          enquiry_id: enquiryId,
          preferred_jurisdiction: input.preferredJurisdiction || null,
          activity_type: input.activityType || null,
          shareholders_count: input.shareholdersCount || null,
          visa_quota_needed: input.visaQuotaNeeded || null,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        });
      });
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'BusinessEnquiryService.submitEnquiry');
    }

    // 3. Operational audit logging (safe background log)
    void this.auditRepo.logEvent({
      action: 'business_enquiry_submitted',
      resource_type: 'enquiry',
      resource_id: enquiryId,
      request_id: context.requestId,
      client_ip: context.clientIp,
      details_json: JSON.stringify({
        reference: publicReference,
        service: input.service,
      }),
    });

    return {
      reference: publicReference,
      enquiryId,
      service: input.service,
    };
  }
}

export const businessEnquiryService = new BusinessEnquiryService();
