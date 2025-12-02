import {
    AppError,
    ValidationError,
    AuthenticationError,
    NotFoundError,
    ConflictError,
} from '../src/middleware/error.middleware';

describe('Error Middleware Unit Tests', () => {
    describe('Custom Error Classes', () => {
        it('should create AppError with correct properties', () => {
            const error = new AppError('Test error', 500);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(AppError);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.isOperational).toBe(true);
        });

        it('should create ValidationError with 400 status', () => {
            const error = new ValidationError('Invalid input');

            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Invalid input');
        });

        it('should create AuthenticationError with 401 status', () => {
            const error = new AuthenticationError();

            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Authentication required');
        });

        it('should create AuthenticationError with custom message', () => {
            const error = new AuthenticationError('Invalid token');

            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Invalid token');
        });

        it('should create NotFoundError with 404 status', () => {
            const error = new NotFoundError('User');

            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('User not found');
        });

        it('should create ConflictError with 409 status', () => {
            const error = new ConflictError('Email already exists');

            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(409);
            expect(error.message).toBe('Email already exists');
        });
    });

    describe('Error Stack Traces', () => {
        it('should capture stack trace', () => {
            const error = new AppError('Test error', 500);

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('AppError');
        });

        it('should have correct constructor in stack', () => {
            const error = new ValidationError('Test');

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('ValidationError');
        });
    });
});
