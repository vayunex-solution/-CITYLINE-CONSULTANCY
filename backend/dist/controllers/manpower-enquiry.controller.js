"use strict";
/**
 * CITYLINE CONSULTANCY — Public Manpower Enquiry Controller
 * Handles public submissions of corporate employer manpower requisitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.manpowerEnquiryController = exports.ManpowerEnquiryController = void 0;
const manpower_enquiry_schema_1 = require("../schemas/manpower-enquiry.schema");
const manpower_enquiry_service_1 = require("../services/manpower-enquiry.service");
class ManpowerEnquiryController {
    /**
     * Submits an employer manpower requirement.
     */
    async submitEnquiry(req, res, next) {
        try {
            const input = manpower_enquiry_schema_1.manpowerEnquiryInputSchema.parse(req.body);
            const idempotencyKey = req.headers['x-idempotency-key'] || input.idempotencyKey;
            const result = await manpower_enquiry_service_1.manpowerEnquiryService.submitEnquiry(input, {
                clientIp: req.ip,
                requestId: req.id,
                idempotencyKey: idempotencyKey || undefined,
            });
            const statusCode = result.isDuplicate ? 200 : 201;
            res.status(statusCode).json({
                success: true,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ManpowerEnquiryController = ManpowerEnquiryController;
exports.manpowerEnquiryController = new ManpowerEnquiryController();
