/**
 * @fileoverview Validation schemas for RR7 Tuner
 * @description Zod schemas for validating user input and configuration files
 */

import { z } from 'zod';

/**
 * Schema for validating CLI arguments from yargs
 */
export const CliArgsSchema = z.object({
    orm: z.enum(['prisma', 'drizzle']).optional(),
    auth: z.enum(['better-auth']).optional(),
    routes: z.boolean().optional(),
    r: z.boolean().optional(), // alias
    databaseType: z.enum([
        // Prisma options
        'postgresql', 'mysql', 'sqlite', 'mongodb', 'sqlserver', 'cockroachdb',
        // Drizzle options  
        'postgres', 'neon', 'vercel-postgres', 'supabase', 'planetscale', 'turso', 'd1'
    ]).optional(),
    dt: z.enum([
        // Prisma options
        'postgresql', 'mysql', 'sqlite', 'mongodb', 'sqlserver', 'cockroachdb',
        // Drizzle options  
        'postgres', 'neon', 'vercel-postgres', 'supabase', 'planetscale', 'turso', 'd1'
    ]).optional(), // alias
    services: z.array(z.enum(['polar', 'railway'])).optional(),
    s: z.array(z.enum(['polar', 'railway'])).optional(), // alias
    _: z.array(z.unknown()).optional(),
    $0: z.string().optional()
}).passthrough(); // Allow additional yargs properties

/**
 * Schema for validating inquirer interactive answers
 */
export const InquirerAnswersSchema = z.object({
    database: z.enum(['prisma', 'drizzle', 'none']),
    databaseType: z.enum([
        // Prisma options
        'postgresql', 'mysql', 'sqlite', 'mongodb', 'sqlserver', 'cockroachdb',
        // Drizzle options  
        'postgres', 'neon', 'vercel-postgres', 'supabase', 'planetscale', 'turso', 'd1'
    ]).optional(),
    auth: z.enum(['better-auth', 'none']),
    includeRoutes: z.boolean(),
    services: z.array(z.enum(['polar', 'railway'])).default([])
});

export type CliArgs = z.infer<typeof CliArgsSchema>;
export type InquirerAnswers = z.infer<typeof InquirerAnswersSchema>;