"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_middleware_1 = require("../src/middleware/error.middleware");
describe('Error Middleware Unit Tests', () => {
    describe('Custom Error Classes', () => {
        it('should create AppError with correct properties', () => {
            const error = new error_middleware_1.AppError('Test error', 500);
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(error_middleware_1.AppError);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.isOperational).toBe(true);
        });
        it('should create ValidationError with 400 status', () => {
            const error = new error_middleware_1.ValidationError('Invalid input');
            expect(error).toBeInstanceOf(error_middleware_1.AppError);
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Invalid input');
        });
        it('should create AuthenticationError with 401 status', () => {
            const error = new error_middleware_1.AuthenticationError();
            expect(error).toBeInstanceOf(error_middleware_1.AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Authentication required');
        });
        it('should create AuthenticationError with custom message', () => {
            const error = new error_middleware_1.AuthenticationError('Invalid token');
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Invalid token');
        });
        it('should create NotFoundError with 404 status', () => {
            const error = new error_middleware_1.NotFoundError('User');
            expect(error).toBeInstanceOf(error_middleware_1.AppError);
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('User not found');
        });
        it('should create ConflictError with 409 status', () => {
            const error = new error_middleware_1.ConflictError('Email already exists');
            expect(error).toBeInstanceOf(error_middleware_1.AppError);
            expect(error.statusCode).toBe(409);
            expect(error.message).toBe('Email already exists');
        });
    });
    describe('Error Stack Traces', () => {
        it('should capture stack trace', () => {
            const error = new error_middleware_1.AppError('Test error', 500);
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('AppError');
        });
        it('should have correct constructor in stack', () => {
            const error = new error_middleware_1.ValidationError('Test');
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('ValidationError');
        });
    });
});
