/**
 * CITYLINE CONSULTANCY — Public Manpower Enquiry Controller
 * Handles public submissions of corporate employer manpower requisitions.
 */

import { Request, Response, NextFunction } from 'express';
import { manpowerEnquiryInputSchema } from '../schemas/manpower-enquiry.schema';
import { manpowerEnquiryService } from '../services/manpower-enquiry.service';

export class ManpowerEnquiryController {
  /**
   * Submits an employer manpower requirement.
   */
  public async submitEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = manpowerEnquiryInputSchema.parse(req.body);
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || input.idempotencyKey;

      const result = await manpowerEnquiryService.submitEnquiry(input, {
        clientIp: req.ip,
        requestId: (req as any).id,
        idempotencyKey: idempotencyKey || undefined,
      });

      const statusCode = result.isDuplicate ? 200 : 201;

      res.status(statusCode).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const manpowerEnquiryController = new ManpowerEnquiryController();
