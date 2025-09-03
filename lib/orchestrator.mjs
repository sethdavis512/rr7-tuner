#!/usr/bin/env zx

/**
 * @fileoverview Main orchestrator for RR7 Tuner
 * @description Coordinates CLI and interactive modes, executes integrations
 */

import { promises as fs } from 'fs';
import { parseCliArguments } from './cli/arguments.mjs';
import { promptUserPreferences } from './cli/interactive.mjs';
import { validateCliArgs, validateInquirerAnswers } from './validation/validators.mjs';
import { integratePrisma } from './integrations/prisma.mjs';
import { integrateDrizzle } from './integrations/drizzle.mjs';
import { 
    integrateBetterAuthWithPrisma, 
    integrateBetterAuthWithDrizzle, 
    integrateBetterAuth 
} from './integrations/better-auth.mjs';
import { printHeader, printSeparator, printError } from './utils/console.mjs';

/**
 * Main orchestration function
 * @returns {Promise<void>}
 */
export async function run() {
    printHeader();

    // Validate environment
    await validateEnvironment();

    // Parse and validate CLI arguments
    const argv = parseCliArguments();
    const validatedArgs = validateCliArgs(argv);
    
    // Determine execution mode
    const hasCliArgs = validatedArgs.orm || validatedArgs.auth;
    
    if (hasCliArgs) {
        await executeCliMode(validatedArgs);
    } else {
        await executeInteractiveMode();
    }
}

/**
 * Validate the current environment
 * @returns {Promise<void>}
 */
async function validateEnvironment() {
    try {
        await fs.readFile('package.json', 'utf8');
    } catch (error) {
        printError('No package.json found in current directory.');
        console.error('💡 Please run this script from the root of your React Router 7 project.');
        process.exit(1);
    }
}

/**
 * Execute CLI mode with provided arguments
 * @param {object} args - Validated CLI arguments
 * @returns {Promise<void>}
 */
async function executeCliMode(args) {
    console.log('🚀 Running in CLI mode...\n');

    const includeRoutes = args.routes !== false;

    // Execute database integration
    if (args.orm === 'prisma') {
        await integratePrisma(includeRoutes);
        if (args.auth !== undefined) {
            printSeparator();
        }
    } else if (args.orm === 'drizzle') {
        await integrateDrizzle(includeRoutes);
        if (args.auth !== undefined) {
            printSeparator();
        }
    }

    // Execute auth integration
    if (args.auth === 'better-auth') {
        if (args.orm === 'prisma') {
            await integrateBetterAuthWithPrisma();
        } else if (args.orm === 'drizzle') {
            await integrateBetterAuthWithDrizzle();
        } else {
            await integrateBetterAuth();
        }
    }

    console.log('\n✨ Integration complete! Check the output above for next steps.');
}

/**
 * Execute interactive mode with prompts
 * @returns {Promise<void>}
 */
async function executeInteractiveMode() {
    console.log('🎯 Running in interactive mode...\n');

    // Get user preferences
    const rawAnswers = await promptUserPreferences();
    const answers = validateInquirerAnswers(rawAnswers);

    // Execute database integration
    if (answers.database === 'prisma') {
        await integratePrisma(answers.includeRoutes);
        if (answers.auth !== 'none') {
            printSeparator();
        }
    } else if (answers.database === 'drizzle') {
        await integrateDrizzle(answers.includeRoutes);
        if (answers.auth !== 'none') {
            printSeparator();
        }
    }

    // Execute auth integration
    if (answers.auth === 'better-auth') {
        if (answers.database === 'prisma') {
            await integrateBetterAuthWithPrisma();
        } else if (answers.database === 'drizzle') {
            await integrateBetterAuthWithDrizzle();
        } else {
            await integrateBetterAuth();
        }
    }

    // Final summary
    if (answers.database !== 'none' || answers.auth !== 'none') {
        console.log('\n✨ Integration complete! Check the output above for next steps.');
    } else {
        console.log('\n👋 No integrations selected. Run the script again when you\'re ready!');
    }
}