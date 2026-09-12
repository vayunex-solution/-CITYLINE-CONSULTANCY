/**
 * CITYLINE CONSULTANCY — Zod Request Validation Middleware Factory
 * Validates request body, query parameters, or route parameters against Zod schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export interface ValidationTarget {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validateRequest(schemas: ValidationTarget) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as Request['params'];
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as Request['query'];
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
