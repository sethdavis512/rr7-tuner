/**
 * @fileoverview Interactive mode prompts and configuration
 * @description Setup and validation of interactive prompts using inquirer
 */

import inquirer from 'inquirer';

export interface DatabaseTypeChoice {
    name: string;
    value: string;
    short: string;
}

export interface InteractiveAnswers {
    database: 'prisma' | 'drizzle' | 'none';
    databaseType?: string;
    auth: 'better-auth' | 'none';
    includeRoutes: boolean;
    services: string[];
}

/**
 * Get database type choices based on ORM selection
 */
function getDatabaseTypeChoices(orm: string): DatabaseTypeChoice[] {
    if (orm === 'prisma') {
        return [
            { name: '🐘  PostgreSQL', value: 'postgresql', short: 'PostgreSQL' },
            { name: '🐬  MySQL/MariaDB', value: 'mysql', short: 'MySQL' },
            { name: '🗃️  SQLite', value: 'sqlite', short: 'SQLite' },
            { name: '🍃  MongoDB', value: 'mongodb', short: 'MongoDB' },
            { name: '🗄️  SQL Server', value: 'sqlserver', short: 'SQL Server' },
            { name: '🪳  CockroachDB', value: 'cockroachdb', short: 'CockroachDB' }
        ];
    } else if (orm === 'drizzle') {
        return [
            { name: '🐘  PostgreSQL', value: 'postgres', short: 'PostgreSQL' },
            { name: '🔵  Neon (PostgreSQL)', value: 'neon', short: 'Neon' },
            { name: '▲  Vercel Postgres', value: 'vercel-postgres', short: 'Vercel Postgres' },
            { name: '⚡  Supabase (PostgreSQL)', value: 'supabase', short: 'Supabase' },
            { name: '🐬  MySQL', value: 'mysql', short: 'MySQL' },
            { name: '🌍  PlanetScale (MySQL)', value: 'planetscale', short: 'PlanetScale' },
            { name: '🗃️  SQLite', value: 'sqlite', short: 'SQLite' },
            { name: '🚀  Turso (SQLite)', value: 'turso', short: 'Turso' },
            { name: '☁️  Cloudflare D1 (SQLite)', value: 'd1', short: 'D1' }
        ];
    }
    return [];
}

/**
 * Prompt user for integration preferences
 */
export async function promptUserPreferences(): Promise<InteractiveAnswers> {
    const answers = await inquirer.prompt<InteractiveAnswers>([
        {
            type: 'list',
            name: 'database',
            message: 'Which database integration would you like to add?',
            choices: [
                {
                    name: '🗄️  Prisma ORM',
                    value: 'prisma',
                    short: 'Prisma'
                },
                {
                    name: '🗃️  Drizzle ORM', 
                    value: 'drizzle',
                    short: 'Drizzle'
                },
                {
                    name: '❌  Skip database setup',
                    value: 'none',
                    short: 'None'
                }
            ]
        },
        {
            type: 'list',
            name: 'databaseType',
            message: (answers: Partial<InteractiveAnswers>) => `Which ${answers.database === 'prisma' ? 'Prisma' : 'Drizzle'} database type would you like to use?`,
            choices: (answers: Partial<InteractiveAnswers>) => getDatabaseTypeChoices(answers.database || ''),
            when: (answers: Partial<InteractiveAnswers>) => answers.database !== 'none'
        },
        {
            type: 'list',
            name: 'auth',
            message: 'Which authentication integration would you like to add?',
            choices: [
                {
                    name: '🔐  Better Auth',
                    value: 'better-auth',
                    short: 'Better Auth'
                },
                {
                    name: '❌  Skip authentication setup',
                    value: 'none',
                    short: 'None'
                }
            ]
        },
        {
            type: 'confirm',
            name: 'includeRoutes',
            message: 'Include example routes? (Posts CRUD operations for learning/testing)',
            default: true
        },
        {
            type: 'checkbox',
            name: 'services',
            message: 'Which additional services would you like to integrate?',
            choices: [
                {
                    name: '💰 Polar.sh (Payments & Subscriptions)',
                    value: 'polar',
                    short: 'Polar.sh'
                },
                {
                    name: '🚄 Railway (Deployment Platform)',
                    value: 'railway',
                    short: 'Railway'
                }
            ],
            default: []
        }
    ]);
    
    return answers;
}