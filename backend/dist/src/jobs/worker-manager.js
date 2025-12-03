"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorkers = void 0;
const biography_worker_1 = require("./workers/biography.worker");
const email_worker_1 = require("./workers/email.worker");
const logger_1 = require("../utils/logger");
const startWorkers = () => {
    logger_1.logger.info('Starting background workers...');
    const biographyWorker = (0, biography_worker_1.createBiographyWorker)();
    const emailWorker = (0, email_worker_1.createEmailWorker)();
    logger_1.logger.info('Background workers started');
    return {
        biographyWorker,
        emailWorker
    };
};
exports.startWorkers = startWorkers;
