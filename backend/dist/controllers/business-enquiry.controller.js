"use strict";
/**
 * CITYLINE CONSULTANCY — Business Setup Enquiry Controller
 * Handles public business setup / company formation consultation requests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessEnquiryController = exports.BusinessEnquiryController = void 0;
const business_enquiry_schema_1 = require("../schemas/business-enquiry.schema");
const business_enquiry_service_1 = require("../services/business-enquiry.service");
const app_error_1 = require("../utils/app-error");
class BusinessEnquiryController {
    service;
    constructor(service = business_enquiry_service_1.businessEnquiryService) {
        this.service = service;
    }
    async submitEnquiry(req, res, next) {
        try {
            const parseResult = business_enquiry_schema_1.businessEnquirySchema.safeParse(req.body);
            if (!parseResult.success) {
                const fieldErrors = {};
                for (const issue of parseResult.error.issues) {
                    const pathKey = issue.path.join('.');
                    if (!fieldErrors[pathKey]) {
                        fieldErrors[pathKey] = issue.message;
                    }
                }
                throw new app_error_1.AppError('Validation failed for business setup enquiry.', 400, 'VALIDATION_ERROR', {
                    fieldErrors,
                });
            }
            const rawFiles = req.files || [];
            const result = await this.service.submitEnquiry(parseResult.data, rawFiles, {
                clientIp: req.ip || req.socket.remoteAddress,
                requestId: req.headers['x-request-id'] || undefined,
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
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BusinessEnquiryController = BusinessEnquiryController;
exports.businessEnquiryController = new BusinessEnquiryController();
