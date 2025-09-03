#!/usr/bin/env node

/**
 * @fileoverview RR7 Tuner CLI executable
 * @description Entry point for npx rr7-tuner command
 */

import { run } from '../lib/orchestrator.mjs';

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run the main orchestrator
run().catch((error) => {
    console.error('Failed to run RR7 Tuner:', error);
    process.exit(1);
});