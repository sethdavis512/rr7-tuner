/**
 * @fileoverview Validation schemas for RR7 Tuner
 * @description Zod schemas for validating user input and configuration files
 */

import { z } from 'zod';

/**
 * Schema for validating package.json structure
 */
export const PackageJsonSchema = z.object({
    scripts: z.record(z.string()).optional().default({}),
    dependencies: z.record(z.string()).optional(),
    devDependencies: z.record(z.string()).optional(),
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
    _: z.array(z.unknown()).optional(),
    $0: z.string().optional()
}).passthrough(); // Allow additional yargs properties

/**
 * Schema for validating inquirer interactive answers
 */
export const InquirerAnswersSchema = z.object({
    database: z.enum(['prisma', 'drizzle', 'none']),
    auth: z.enum(['better-auth', 'none']),
    includeRoutes: z.boolean()
});

/**
 * Schema for validating integration options
 */
export const IntegrationOptionsSchema = z.object({
    includeRoutes: z.boolean().default(true),
    database: z.enum(['prisma', 'drizzle']).optional(),
    auth: z.enum(['better-auth']).optional()
});