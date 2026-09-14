/**
 * CITYLINE CONSULTANCY — Public Testimonials Controller
 * Serves verified published testimonials for public website consumption.
 */

import { Request, Response, NextFunction } from 'express';
import { testimonialService, TestimonialService } from '../services/testimonial.service';
import { sendSuccess } from '../utils/api-response';

export class TestimonialController {
  constructor(private readonly service: TestimonialService = testimonialService) {}

  public getPublishedTestimonials = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const testimonials = await this.service.getPublishedTestimonials();
      sendSuccess(res, testimonials, 200, (req as any).id);
    } catch (error) {
      next(error);
    }
  };
}

export const testimonialController = new TestimonialController();
