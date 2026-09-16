"use strict";
/**
 * CITYLINE CONSULTANCY — Phase 9 Manpower Enquiry Validation Schemas
 * Defines strict Zod input schemas for public employer manpower submissions,
 * status transitions, administrative updates, and canonical request fingerprinting.
 *
 * GOVERNANCE:
 * - Rejects sensitive business identifiers (trade license, TRN).
 * - Enforces the 8 locked canonical job categories.
 * - Restricts positions array (1 to 10) and headcount per position (1 to 500).
 * - Excludes transport headers and idempotencyKey from business fingerprint hash.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manpowerQuerySchema = exports.adminUpdateManpowerEnquirySchema = exports.adminUpdateManpowerStatusSchema = exports.manpowerEnquiryInputSchema = exports.manpowerPositionInputSchema = exports.ALLOWED_MANPOWER_STATUS_TRANSITIONS = exports.MANPOWER_STATUSES = exports.LOCKED_JOB_CATEGORIES = void 0;
exports.serializeCanonicalPosition = serializeCanonicalPosition;
exports.computeCanonicalRequestHash = computeCanonicalRequestHash;
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
exports.LOCKED_JOB_CATEGORIES = [
    'hotel-staff',
    'cleaning',
    'mason',
    'steel-fixer',
    'carpenter',
    'bike-rider-delivery',
    'taxi-driver',
    'truck-driver',
];
exports.MANPOWER_STATUSES = [
    'new',
    'reviewing',
    'contacted',
    'qualified',
    'processing',
    'fulfilled',
    'rejected',
    'closed',
];
exports.ALLOWED_MANPOWER_STATUS_TRANSITIONS = {
    new: ['reviewing', 'rejected', 'closed'],
    reviewing: ['contacted', 'rejected', 'closed'],
    contacted: ['qualified', 'rejected', 'closed'],
    qualified: ['processing', 'rejected', 'closed'],
    processing: ['fulfilled', 'closed'],
    fulfilled: ['closed'],
    rejected: ['closed'],
    closed: [], // Terminal state
};
// --- Position Input Schema ---
exports.manpowerPositionInputSchema = zod_1.z
    .object({
    categorySlug: zod_1.z.enum(exports.LOCKED_JOB_CATEGORIES, {
        errorMap: () => ({
            message: 'Invalid job category. Must match one of the 8 canonical categories (e.g. hotel-staff, cleaning, mason, etc.).',
        }),
    }),
    roleTitle: zod_1.z
        .string({ required_error: 'Role title is required' })
        .trim()
        .min(2, 'Role title must be at least 2 characters')
        .max(150, 'Role title cannot exceed 150 characters'),
    headcount: zod_1.z
        .number({ required_error: 'Headcount quantity is required' })
        .int('Headcount must be a whole number')
        .min(1, 'Minimum headcount is 1')
        .max(500, 'Maximum headcount per role is 500'),
    experienceYearsRequired: zod_1.z
        .number()
        .int('Experience years must be an integer')
        .min(0, 'Experience years cannot be negative')
        .max(30, 'Experience years cannot exceed 30')
        .optional()
        .nullable(),
    qualification: zod_1.z.string().trim().max(255).optional().nullable(),
    genderRequirement: zod_1.z.enum(['any', 'male', 'female']).optional().nullable(),
    languageRequirements: zod_1.z.string().trim().max(255).optional().nullable(),
    salaryOffered: zod_1.z.string().trim().max(100).optional().nullable(),
    accommodationProvided: zod_1.z.enum(['provided', 'allowance', 'not_provided']).optional().nullable(),
    transportProvided: zod_1.z.enum(['provided', 'allowance', 'not_provided']).optional().nullable(),
    foodProvided: zod_1.z.enum(['provided', 'allowance', 'not_provided']).optional().nullable(),
    notes: zod_1.z.string().trim().max(1000).optional().nullable(),
})
    .strict();
// --- Public Employer Manpower Enquiry Schema ---
exports.manpowerEnquiryInputSchema = zod_1.z
    .object({
    companyName: zod_1.z
        .string({ required_error: 'Company name is required' })
        .trim()
        .min(2, 'Company name must be at least 2 characters')
        .max(255, 'Company name cannot exceed 255 characters'),
    contactPerson: zod_1.z
        .string({ required_error: 'Contact person name is required' })
        .trim()
        .min(2, 'Contact person name must be at least 2 characters')
        .max(150, 'Contact person name cannot exceed 150 characters'),
    contactDesignation: zod_1.z.string().trim().max(150).optional().nullable(),
    email: zod_1.z
        .string({ required_error: 'Corporate email is required' })
        .trim()
        .email('A valid corporate email address is required')
        .max(255, 'Email cannot exceed 255 characters')
        .toLowerCase(),
    phone: zod_1.z
        .string({ required_error: 'Contact phone number is required' })
        .trim()
        .min(7, 'Phone number must be at least 7 characters')
        .max(30, 'Phone number cannot exceed 30 characters'),
    whatsapp: zod_1.z.string().trim().max(30).optional().nullable(),
    city: zod_1.z
        .string({ required_error: 'UAE city/emirate is required' })
        .trim()
        .min(2, 'City must be at least 2 characters')
        .max(100, 'City cannot exceed 100 characters'),
    website: zod_1.z.string().trim().max(255).optional().nullable(),
    industry: zod_1.z.string().trim().max(100).optional().nullable(),
    preferredTimeline: zod_1.z
        .enum(['immediate', '30-days', '60-days', 'ongoing'])
        .optional()
        .nullable(),
    deploymentLocation: zod_1.z.string().trim().max(150).optional().nullable(),
    specialRequirements: zod_1.z.string().trim().max(2000).optional().nullable(),
    positions: zod_1.z
        .array(exports.manpowerPositionInputSchema)
        .min(1, 'At least one manpower role position is required')
        .max(10, 'Cannot exceed 10 positions per enquiry submission'),
    idempotencyKey: zod_1.z.string().trim().max(100).optional().nullable(),
})
    .strict(); // Rejects trade_license_number, trn, country, or any arbitrary fields
// --- Admin Update Status Schema ---
exports.adminUpdateManpowerStatusSchema = zod_1.z
    .object({
    status: zod_1.z.enum(exports.MANPOWER_STATUSES, {
        required_error: 'Valid status is required',
    }),
    notes: zod_1.z.string().trim().max(2000).optional().nullable(),
})
    .strict();
// --- Admin Generic Update Schema (Tightly Restricted) ---
exports.adminUpdateManpowerEnquirySchema = zod_1.z
    .object({
    adminNotes: zod_1.z.string().trim().max(2000).optional().nullable(),
    deploymentLocation: zod_1.z.string().trim().max(150).optional().nullable(),
    preferredTimeline: zod_1.z
        .enum(['immediate', '30-days', '60-days', 'ongoing'])
        .optional()
        .nullable(),
    specialRequirements: zod_1.z.string().trim().max(2000).optional().nullable(),
})
    .strict(); // Rejects status, company_name, email, phone, reference_number, etc.
// --- Query Parameters Schema ---
exports.manpowerQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.enum(exports.MANPOWER_STATUSES).optional(),
    search: zod_1.z.string().trim().optional(),
    city: zod_1.z.string().trim().optional(),
    dateFrom: zod_1.z.string().trim().optional(),
    dateTo: zod_1.z.string().trim().optional(),
});
// --- Canonical Request Fingerprint Generator ---
/**
 * Normalizes a single position into a canonical representation with alphabetical key ordering.
 */
function serializeCanonicalPosition(pos) {
    const canonicalObj = {
        accommodationProvided: pos.accommodationProvided?.trim() || null,
        categorySlug: pos.categorySlug.toLowerCase().trim(),
        experienceYearsRequired: pos.experienceYearsRequired ?? null,
        foodProvided: pos.foodProvided?.trim() || null,
        genderRequirement: pos.genderRequirement?.trim() || null,
        headcount: pos.headcount,
        languageRequirements: pos.languageRequirements?.trim() || null,
        notes: pos.notes?.trim() || null,
        qualification: pos.qualification?.trim() || null,
        roleTitle: pos.roleTitle.trim(),
        salaryOffered: pos.salaryOffered?.trim() || null,
        transportProvided: pos.transportProvided?.trim() || null,
    };
    return JSON.stringify(sortObjectKeys(canonicalObj));
}
function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }
    const sortedKeys = Object.keys(obj).sort();
    const result = {};
    for (const key of sortedKeys) {
        result[key] = sortObjectKeys(obj[key]);
    }
    return result;
}
/**
 * Computes a deterministic SHA-256 canonical request hash for a manpower enquiry submission.
 * - Normalizes all business fields.
 * - Sorts serialized positions lexicographically (eliminating array order dependency).
 * - Excludes idempotencyKey and transport metadata.
 */
function computeCanonicalRequestHash(input) {
    // 1. Serialize and lexicographically sort positions
    const sortedSerializedPositions = input.positions
        .map(serializeCanonicalPosition)
        .sort();
    // 2. Assemble canonical request object with normalized values
    const canonicalRequest = {
        city: input.city.trim(),
        companyName: input.companyName.trim().toLowerCase(),
        contactDesignation: input.contactDesignation?.trim() || null,
        contactPerson: input.contactPerson.trim(),
        country: 'United Arab Emirates',
        deploymentLocation: input.deploymentLocation?.trim() || null,
        email: input.email.trim().toLowerCase(),
        industry: input.industry?.trim() || null,
        phone: input.phone.trim(),
        positions: sortedSerializedPositions.map((s) => JSON.parse(s)),
        preferredTimeline: input.preferredTimeline?.trim() || null,
        specialRequirements: input.specialRequirements?.trim() || null,
        website: input.website?.trim() || null,
        whatsapp: input.whatsapp?.trim() || null,
    };
    // 3. Serialize deterministic JSON with keys sorted recursively
    const serialized = JSON.stringify(sortObjectKeys(canonicalRequest));
    // 4. Compute SHA-256 digest
    return crypto_1.default.createHash('sha256').update(serialized).digest('hex');
}
