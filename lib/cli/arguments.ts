/**
 * @fileoverview CLI argument parsing and configuration
 * @description Setup and validation of command-line arguments using yargs
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface CliArguments {
    orm?: 'prisma' | 'drizzle';
    db?: 'prisma' | 'drizzle';
    databaseType?: string;
    dt?: string;
    auth?: 'better-auth';
    routes?: boolean;
    r?: boolean;
    services?: string[];
    s?: string[];
    help?: boolean;
    version?: boolean;
}

/**
 * Configure and parse CLI arguments
 */
export function parseCliArguments(): CliArguments {
    return yargs(hideBin(process.argv))
        .option('orm', {
            alias: 'db',
            type: 'string',
            description: 'Database type to integrate',
            choices: ['prisma', 'drizzle'] as const
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
            ] as const
        })
        .option('auth', {
            type: 'string',
            description: 'Authentication method to integrate',
            choices: ['better-auth'] as const
        })
        .option('routes', {
            alias: 'r',
            type: 'boolean',
            description: 'Include example routes (CRUD operations)',
            default: true
        })
        .option('services', {
            alias: 's',
            type: 'array',
            description: 'Additional services to integrate',
            choices: ['polar'] as const
        })
        .help()
        .version('1.0.0')
        .parseSync() as CliArguments;
}