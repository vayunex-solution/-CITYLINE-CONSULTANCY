/**
 * CITYLINE CONSULTANCY — Visa Enquiry Controller
 * Handles public multipart visa enquiry requests with validation, service delegation,
 * and safe, structured responses without internal SQL or path leakage.
 */

import { Request, Response, NextFunction } from 'express';
import { visaEnquirySchema } from '../schemas/visa-enquiry.schema';
import { visaEnquiryService, VisaEnquiryService } from '../services/visa-enquiry.service';
import { visaServiceRepository, VisaServiceRepository } from '../repositories/visa-service.repository';
import { AppError } from '../utils/app-error';

export class VisaEnquiryController {
  constructor(
    private service: VisaEnquiryService = visaEnquiryService,
    private visaRepo: VisaServiceRepository = visaServiceRepository
  ) {}

  public async listServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const services = await this.visaRepo.findAllActive();
      res.status(200).json({
        success: true,
        data: services.map((s) => ({
          id: s.id,
          serviceCode: s.service_code,
          title: s.title,
          slug: s.slug,
          description: s.description,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  public async submitEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Authoritative Zod schema validation
      const parseResult = visaEnquirySchema.safeParse(req.body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parseResult.error.issues) {
          const pathKey = issue.path.join('.');
          if (!fieldErrors[pathKey]) {
            fieldErrors[pathKey] = issue.message;
          }
        }

        throw new AppError('Validation failed for visa enquiry submission.', 400, 'VALIDATION_ERROR', {
          fieldErrors,
        });
      }

      // 2. Extract uploaded files from Multer
      const rawFiles = (req.files as Express.Multer.File[]) || [];

      // 3. Delegate to core domain service
      const result = await this.service.submitVisaEnquiry(parseResult.data, rawFiles, {
        clientIp: req.ip || req.socket.remoteAddress,
        requestId: (req.headers['x-request-id'] as string) || undefined,
      });

      // 4. Return safe, structured public response
      res.status(201).json({
        success: true,
        message: 'Your visa consultation enquiry has been submitted successfully.',
        data: {
          reference: result.reference,
          serviceTitle: result.serviceTitle,
          documentsUploaded: result.documentsCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const visaEnquiryController = new VisaEnquiryController();
