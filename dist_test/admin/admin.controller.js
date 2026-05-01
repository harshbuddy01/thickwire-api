"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const telegram_service_1 = require("../telegram/telegram.service");
let AdminController = class AdminController {
    constructor(adminService, telegram) {
        this.adminService = adminService;
        this.telegram = telegram;
    }
    async dashboard() {
        return this.adminService.getDashboardStats();
    }
    async listAdmins() {
        return this.adminService.findAllAdmins();
    }
    async createAdmin(body) {
        return this.adminService.createAdmin(body);
    }
    async updateAdmin(id, body) {
        return this.adminService.updateAdmin(id, body);
    }
    async auditLogs(page, limit) {
        return this.adminService.getAuditLogs(page, limit);
    }
    async testTelegram() {
        const ok = await this.telegram.testConnection();
        return { success: ok };
    }
    async listCustomers(search, page, limit) {
        return this.adminService.findAllCustomers({ search, page, limit });
    }
    async getCustomer(id) {
        return this.adminService.getCustomerDetail(id);
    }
    async toggleCustomer(id, isActive) {
        return this.adminService.toggleCustomerActive(id, isActive);
    }
    async listSubscriptions(status, search, page, limit) {
        return this.adminService.findAllSubscriptions({ status, search, page, limit });
    }
    async listDeliveredCredentials(page, limit) {
        return this.adminService.getDeliveredCredentials({ page, limit });
    }
    async getOrderCredential(id) {
        return this.adminService.getOrderCredentialForAdmin(id);
    }
    async revenueByService() {
        return this.adminService.getRevenueByService();
    }
    async revenueByPlan() {
        return this.adminService.getRevenueByPlan();
    }
    async couponPerformance() {
        return this.adminService.getCouponPerformance();
    }
    async ordersExport() {
        return this.adminService.getOrdersExport('json');
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listAdmins", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAdmin", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAdmin", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "auditLogs", null);
__decorate([
    (0, common_1.Post)('settings/test-telegram'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "testTelegram", null);
__decorate([
    (0, common_1.Get)('customers'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listCustomers", null);
__decorate([
    (0, common_1.Get)('customers/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCustomer", null);
__decorate([
    (0, common_1.Put)('customers/:id/toggle-active'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleCustomer", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listSubscriptions", null);
__decorate([
    (0, common_1.Get)('subscriptions/delivered'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listDeliveredCredentials", null);
__decorate([
    (0, common_1.Get)('orders/:id/credential'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrderCredential", null);
__decorate([
    (0, common_1.Get)('reports/revenue-by-service'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "revenueByService", null);
__decorate([
    (0, common_1.Get)('reports/revenue-by-plan'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "revenueByPlan", null);
__decorate([
    (0, common_1.Get)('reports/coupon-performance'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "couponPerformance", null);
__decorate([
    (0, common_1.Get)('reports/orders-export'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "ordersExport", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        telegram_service_1.TelegramService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map