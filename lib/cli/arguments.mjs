/**
 * @fileoverview CLI argument parsing and configuration
 * @description Setup and validation of command-line arguments using yargs
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Configure and parse CLI arguments
 * @returns {object} Parsed CLI arguments
 */
export function parseCliArguments() {
    return yargs(hideBin(process.argv))
        .option('orm', {
            alias: 'db',
            type: 'string',
            description: 'Database type to integrate',
            choices: ['prisma', 'drizzle']
        })
        .option('database-type', {
            alias: 'dt',
            type: 'string',
            description: 'Specific database type/provider to use',
            choices: [
                // Prisma options
                'postgresql', 'mysql', 'sqlite', 'mongodb', 'sqlserver', 'cockroachdb',
                // Drizzle options  
                'postgres', 'neon', 'vercel-postgres', 'supabase', 'planetscale', 'turso', 'd1'
            ]
        })
        .option('auth', {
            type: 'string',
            description: 'Authentication method to integrate',
            choices: ['better-auth']
        })
        .option('routes', {
            alias: 'r',
            type: 'boolean',
            description: 'Include example routes (CRUD operations)',
            default: true
        })
        .help()
        .version('0.0.1').argv;
}