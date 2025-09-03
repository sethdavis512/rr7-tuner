/**
 * @fileoverview Interactive mode prompts and configuration
 * @description Setup and validation of interactive prompts using inquirer
 */

import inquirer from 'inquirer';

/**
 * Get database type choices based on ORM selection
 * @param {string} orm - Selected ORM (prisma or drizzle)
 * @returns {Array} Array of database type choices
 */
function getDatabaseTypeChoices(orm) {
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
 * @returns {Promise<object>} User selections
 */
export async function promptUserPreferences() {
    const answers = await inquirer.prompt([
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
            message: (answers) => `Which ${answers.database === 'prisma' ? 'Prisma' : 'Drizzle'} database type would you like to use?`,
            choices: (answers) => getDatabaseTypeChoices(answers.database),
            when: (answers) => answers.database !== 'none'
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
        }
    ]);
    
    return answers;
}