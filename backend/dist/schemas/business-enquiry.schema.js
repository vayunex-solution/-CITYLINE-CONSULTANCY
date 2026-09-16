"use strict";
/**
 * CITYLINE CONSULTANCY — Business Setup & Consultation Enquiry Validation Schema
 * Authoritative Zod schema enforcing data types and sanitization.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessEnquirySchema = void 0;
const zod_1 = require("zod");
exports.businessEnquirySchema = zod_1.z.object({
    fullName: zod_1.z
        .string({ required_error: 'Full legal name is required' })
        .trim()
        .min(2, 'Full name must be at least 2 characters')
        .max(150, 'Full name cannot exceed 150 characters'),
    email: zod_1.z
        .string({ required_error: 'Email address is required' })
        .trim()
        .email('Please provide a valid email address')
        .max(255, 'Email cannot exceed 255 characters')
        .toLowerCase(),
    phone: zod_1.z
        .string({ required_error: 'Phone number is required' })
        .trim()
        .min(7, 'Phone number must be at least 7 digits')
        .max(50, 'Phone number cannot exceed 50 characters')
        .regex(/^[+0-9\s\-()]+$/, 'Phone number contains invalid characters'),
    whatsapp: zod_1.z
        .string()
        .trim()
        .max(50, 'WhatsApp number cannot exceed 50 characters')
        .regex(/^[+0-9\s\-()]+$/, 'WhatsApp number contains invalid characters')
        .optional()
        .nullable()
        .or(zod_1.z.literal('')),
    service: zod_1.z
        .string({ required_error: 'Please select a service interest' })
        .trim()
        .min(2, 'Service area is required')
        .max(100, 'Service area cannot exceed 100 characters'),
    preferredJurisdiction: zod_1.z
        .string()
        .trim()
        .max(100, 'Preferred jurisdiction cannot exceed 100 characters')
        .optional()
        .nullable()
        .or(zod_1.z.literal('')),
    activityType: zod_1.z
        .string()
        .trim()
        .max(255, 'Activity type cannot exceed 255 characters')
        .optional()
        .nullable()
        .or(zod_1.z.literal('')),
    shareholdersCount: zod_1.z.coerce
        .number()
        .int('Shareholder count must be an integer')
        .min(1, 'Minimum shareholders is 1')
        .max(50, 'Maximum shareholders is 50')
        .optional()
        .nullable(),
    visaQuotaNeeded: zod_1.z.coerce
        .number()
        .int('Visa quota must be an integer')
        .min(0, 'Visa quota cannot be negative')
        .max(500, 'Maximum visa quota is 500')
        .optional()
        .nullable(),
    message: zod_1.z
        .string({ required_error: 'Please provide brief details regarding your enquiry' })
        .trim()
        .min(5, 'Please provide at least 5 characters of detail')
        .max(2000, 'Enquiry details cannot exceed 2000 characters'),
    consent: zod_1.z.preprocess((val) => val === true || val === 'true' || val === '1' || val === 1, zod_1.z.literal(true, {
        errorMap: () => ({ message: 'You must provide consent to submit a consultation enquiry' }),
    })),
});
