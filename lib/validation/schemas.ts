/**
 * @fileoverview Validation schemas for RR7 Tuner
 * @description Zod schemas for validating user input and configuration files
 */

import { z } from 'zod';

/**
 * Schema for validating package.json structure
 */
export const PackageJsonSchema = z.object({
    scripts: z.record(z.string(), z.string()).default({}),
    dependencies: z.record(z.string(), z.string()).optional(),
    devDependencies: z.record(z.string(), z.string()).optional(),
    prisma: z.object({
        seed: z.string().optional()
    }).optional()
});

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
    services: z.array(z.enum(['polar'])).optional(),
    s: z.array(z.enum(['polar'])).optional(), // alias
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
    services: z.array(z.enum(['polar'])).default([])
});

/**
 * Schema for validating integration options
 */
export const IntegrationOptionsSchema = z.object({
    includeRoutes: z.boolean().default(true),
    database: z.enum(['prisma', 'drizzle']).optional(),
    auth: z.enum(['better-auth']).optional()
});

export type PackageJson = z.infer<typeof PackageJsonSchema>;
export type CliArgs = z.infer<typeof CliArgsSchema>;
export type InquirerAnswers = z.infer<typeof InquirerAnswersSchema>;
export type IntegrationOptions = z.infer<typeof IntegrationOptionsSchema>;