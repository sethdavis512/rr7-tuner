/**
 * @fileoverview Main orchestrator for RR7 Tuner
 * @description Coordinates CLI and interactive modes, executes integrations
 */

import { promises as fs } from 'fs';
import { parseCliArguments, type CliArguments } from './cli/arguments.ts';
import { promptUserPreferences, type InteractiveAnswers } from './cli/interactive.ts';
import { validateCliArgs, validateInquirerAnswers } from './validation/validators.ts';
import { integratePrisma } from './integrations/prisma.ts';
import { integrateDrizzle } from './integrations/drizzle.ts';
import { 
    integrateBetterAuthWithPrisma, 
    integrateBetterAuthWithDrizzle, 
    integrateBetterAuth 
} from './integrations/better-auth.ts';
import { integratePolar } from './integrations/polar.ts';
import { printHeader, printSeparator, printError } from './utils/console.ts';

/**
 * Main orchestration function
 */
export async function run(): Promise<void> {
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
 */
async function validateEnvironment(): Promise<void> {
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
 */
async function executeCliMode(args: CliArguments): Promise<void> {
    console.log('🚀 Running in CLI mode...\n');

    const includeRoutes = args.routes !== false;
    const databaseType = args.databaseType || args.dt;

    // Execute database integration
    if (args.orm === 'prisma') {
        const prismaDbType = databaseType || 'postgresql';
        await integratePrisma(includeRoutes, prismaDbType);
        if (args.auth !== undefined) {
            printSeparator();
        }
    } else if (args.orm === 'drizzle') {
        const drizzleDbType = databaseType || 'turso';
        await integrateDrizzle(includeRoutes, drizzleDbType);
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

    // Execute service integrations
    const services = args.services || args.s || [];
    if (services.includes('polar')) {
        if (args.auth || services.length > 0) {
            printSeparator();
        }
        await integratePolar(args.auth);
    }

    console.log('\n✨ Integration complete! Check the output above for next steps.');
}

/**
 * Execute interactive mode with prompts
 */
async function executeInteractiveMode(): Promise<void> {
    console.log('🎯 Running in interactive mode...\n');

    // Get user preferences
    const rawAnswers = await promptUserPreferences();
    const answers = validateInquirerAnswers(rawAnswers);

    // Execute database integration
    if (answers.database === 'prisma') {
        const databaseType = answers.databaseType || 'postgresql';
        await integratePrisma(answers.includeRoutes, databaseType);
        if (answers.auth !== 'none') {
            printSeparator();
        }
    } else if (answers.database === 'drizzle') {
        const databaseType = answers.databaseType || 'turso';
        await integrateDrizzle(answers.includeRoutes, databaseType);
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

    // Execute service integrations
    if (answers.services.includes('polar')) {
        if (answers.auth !== 'none' || answers.services.length > 0) {
            printSeparator();
        }
        await integratePolar(answers.auth);
    }

    // Final summary
    const hasIntegrations = answers.database !== 'none' || answers.auth !== 'none' || answers.services.length > 0;
    if (hasIntegrations) {
        console.log('\n✨ Integration complete! Check the output above for next steps.');
    } else {
        console.log('\n👋 No integrations selected. Run the script again when you\'re ready!');
    }
}