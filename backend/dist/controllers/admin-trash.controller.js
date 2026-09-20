"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Trash Controller
 * Handles trash listing, item restoration, permanent removal, and 30-day automated purge.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminTrashController = exports.AdminTrashController = void 0;
const admin_trash_service_1 = require("../services/admin-trash.service");
const app_error_1 = require("../utils/app-error");
class AdminTrashController {
    service;
    constructor(service = admin_trash_service_1.adminTrashService) {
        this.service = service;
    }
    listTrash = async (req, res, next) => {
        try {
            const search = req.query.search || undefined;
            const result = await this.service.listTrashItems(search);
            res.status(200).json({
                success: true,
                data: result.items,
                pagination: {
                    total: result.total,
                    page: 1,
                    limit: result.total,
                    totalPages: 1,
                },
            });
        }
        catch (err) {
            next(err);
        }
    };
    restoreItem = async (req, res, next) => {
        try {
            const { type, id } = req.params;
            if (!['visa_enquiry', 'business_enquiry', 'job_application'].includes(type)) {
                throw new app_error_1.AppError('Invalid trash item type.', 400, 'INVALID_TYPE');
            }
            const admin = req.admin;
            await this.service.restoreTrashItem(type, id, {
                adminId: admin?.id,
                adminEmail: admin?.email,
                ip: req.ip || req.socket.remoteAddress,
            });
            res.status(200).json({
                success: true,
                message: 'Item has been restored to active list successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    };
    deleteItem = async (req, res, next) => {
        try {
            const { type, id } = req.params;
            if (!['visa_enquiry', 'business_enquiry', 'job_application'].includes(type)) {
                throw new app_error_1.AppError('Invalid trash item type.', 400, 'INVALID_TYPE');
            }
            const admin = req.admin;
            await this.service.permanentlyDeleteItem(type, id, {
                adminId: admin?.id,
                adminEmail: admin?.email,
                ip: req.ip || req.socket.remoteAddress,
            });
            res.status(200).json({
                success: true,
                message: 'Item and associated files have been permanently deleted.',
            });
        }
        catch (err) {
            next(err);
        }
    };
    purgeTrash = async (req, res, next) => {
        try {
            const admin = req.admin;
            const emptyAll = req.body?.emptyAll === true;
            const result = emptyAll
                ? await this.service.emptyAllTrash({
                    adminId: admin?.id,
                    adminEmail: admin?.email,
                    ip: req.ip || req.socket.remoteAddress,
                })
                : await this.service.purgeExpiredTrash(30, {
                    adminId: admin?.id,
                    adminEmail: admin?.email,
                    ip: req.ip || req.socket.remoteAddress,
                });
            res.status(200).json({
                success: true,
                message: `Successfully purged ${result.purgedCount} item(s) from Trash.`,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AdminTrashController = AdminTrashController;
exports.adminTrashController = new AdminTrashController();
