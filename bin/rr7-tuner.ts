#!/usr/bin/env bun

/**
 * @fileoverview RR7 Tuner CLI executable
 * @description Entry point for bunx rr7-tuner command
 */

import { run } from '../lib/orchestrator.ts';

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run the main orchestrator
run().catch((error: Error) => {
    console.error('Failed to run RR7 Tuner:', error);
    process.exit(1);
});