"use strict";
/**
 * CITYLINE CONSULTANCY — Zod Request Validation Middleware Factory
 * Validates request body, query parameters, or route parameters against Zod schemas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
function validateRequest(schemas) {
    return async (req, _res, next) => {
        try {
            if (schemas.params) {
                req.params = (await schemas.params.parseAsync(req.params));
            }
            if (schemas.query) {
                req.query = (await schemas.query.parseAsync(req.query));
            }
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
