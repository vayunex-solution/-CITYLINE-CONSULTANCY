"use strict";
/**
 * CITYLINE CONSULTANCY — Visa Enquiry Controller
 * Handles public multipart visa enquiry requests with validation, service delegation,
 * and safe, structured responses without internal SQL or path leakage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.visaEnquiryController = exports.VisaEnquiryController = void 0;
const visa_enquiry_schema_1 = require("../schemas/visa-enquiry.schema");
const visa_enquiry_service_1 = require("../services/visa-enquiry.service");
const visa_service_repository_1 = require("../repositories/visa-service.repository");
const app_error_1 = require("../utils/app-error");
class VisaEnquiryController {
    service;
    visaRepo;
    constructor(service = visa_enquiry_service_1.visaEnquiryService, visaRepo = visa_service_repository_1.visaServiceRepository) {
        this.service = service;
        this.visaRepo = visaRepo;
    }
    async listServices(_req, res, next) {
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
        }
        catch (err) {
            next(err);
        }
    }
    async submitEnquiry(req, res, next) {
        try {
            // 1. Authoritative Zod schema validation
            const parseResult = visa_enquiry_schema_1.visaEnquirySchema.safeParse(req.body);
            if (!parseResult.success) {
                const fieldErrors = {};
                for (const issue of parseResult.error.issues) {
                    const pathKey = issue.path.join('.');
                    if (!fieldErrors[pathKey]) {
                        fieldErrors[pathKey] = issue.message;
                    }
                }
                throw new app_error_1.AppError('Validation failed for visa enquiry submission.', 400, 'VALIDATION_ERROR', {
                    fieldErrors,
                });
            }
            // 2. Extract uploaded files from Multer
            const rawFiles = req.files || [];
            // 3. Delegate to core domain service
            const result = await this.service.submitVisaEnquiry(parseResult.data, rawFiles, {
                clientIp: req.ip || req.socket.remoteAddress,
                requestId: req.headers['x-request-id'] || undefined,
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
        }
        catch (err) {
            next(err);
        }
    }
}
exports.VisaEnquiryController = VisaEnquiryController;
exports.visaEnquiryController = new VisaEnquiryController();
