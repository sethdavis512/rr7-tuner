#!/usr/bin/env zx

/**
 * @fileoverview RR7 Tuner - React Router 7 Enhancement Tool
 * @description A CLI tool that adds production-ready features to React Router 7 applications
 * 
 * Features:
 * - Prisma integration following official React Router 7 guide
 * - Drizzle ORM integration with SQLite/LibSQL
 * - Better Auth integration with proper adapters
 * - Interactive and CLI modes with full validation
 * - Optional example routes generation
 * 
 * @version 1.0.0
 * @author Seth Davis <sethdavis512@gmail.com>
 */

import { run } from './lib/orchestrator.mjs';

/**
 * Main entry point with error handling
 */
async function main() {
    try {
        await run();
    } catch (error) {
        console.error('❌ Script execution failed:', error.message);
        console.error('\n🔍 Debug information:');
        console.error(error.stack);
        console.error('\n💡 Common fixes:');
        console.error('- Ensure you are running this in a React Router 7 project directory');
        console.error('- Check that you have write permissions in this directory');
        console.error('- Verify your Node.js version is 18+ and npm is installed');
        console.error('- Make sure your package.json exists and is valid JSON');
        process.exit(1);
    }
}

// Execute main function
main();