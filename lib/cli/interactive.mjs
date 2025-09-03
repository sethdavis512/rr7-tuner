/**
 * @fileoverview Interactive mode prompts and configuration
 * @description Setup and validation of interactive prompts using inquirer
 */

import inquirer from 'inquirer';

/**
 * Prompt user for integration preferences
 * @returns {Promise<object>} User selections
 */
export async function promptUserPreferences() {
    return await inquirer.prompt([
        {
            type: 'list',
            name: 'database',
            message: 'Which database integration would you like to add?',
            choices: [
                {
                    name: '🗄️  Prisma ORM (PostgreSQL)',
                    value: 'prisma',
                    short: 'Prisma'
                },
                {
                    name: '🗃️  Drizzle ORM (SQLite/LibSQL)', 
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
}