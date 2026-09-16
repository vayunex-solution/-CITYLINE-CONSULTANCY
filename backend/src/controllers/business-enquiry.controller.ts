/**
 * CITYLINE CONSULTANCY — Business Setup Enquiry Controller
 * Handles public business setup / company formation consultation requests.
 */

import { Request, Response, NextFunction } from 'express';
import { businessEnquirySchema } from '../schemas/business-enquiry.schema';
import { businessEnquiryService, BusinessEnquiryService } from '../services/business-enquiry.service';
import { AppError } from '../utils/app-error';

export class BusinessEnquiryController {
  constructor(private service: BusinessEnquiryService = businessEnquiryService) {}

  public async submitEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = businessEnquirySchema.safeParse(req.body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parseResult.error.issues) {
          const pathKey = issue.path.join('.');
          if (!fieldErrors[pathKey]) {
            fieldErrors[pathKey] = issue.message;
          }
        }

        throw new AppError('Validation failed for business setup enquiry.', 400, 'VALIDATION_ERROR', {
          fieldErrors,
        });
      }

      const rawFiles = (req.files as Express.Multer.File[]) || [];

      const result = await this.service.submitEnquiry(parseResult.data, rawFiles, {
        clientIp: req.ip || req.socket.remoteAddress,
        requestId: (req.headers['x-request-id'] as string) || undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Your consultation enquiry has been submitted successfully.',
        data: {
          reference: result.reference,
          service: result.service,
          documentsCount: result.documentsCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const businessEnquiryController = new BusinessEnquiryController();
