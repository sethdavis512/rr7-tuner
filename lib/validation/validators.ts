/**
 * @fileoverview Input validation functions
 * @description Safe validation functions with proper error handling
 */

import {
    PackageJsonSchema,
    CliArgsSchema,
    InquirerAnswersSchema,
    IntegrationOptionsSchema,
    type PackageJson,
    type CliArgs,
    type InquirerAnswers,
    type IntegrationOptions
} from './schemas.ts';

/**
 * Validates package.json data structure
 */
export function validatePackageJson(data: unknown): PackageJson {
    try {
        return PackageJsonSchema.parse(data);
    } catch (error) {
        const err = error as Error;
        console.error('❌ Invalid package.json structure:', err.message);
        throw new Error('Failed to parse package.json. Please ensure it has valid JSON structure.');
    }
}

/**
 * Validates CLI arguments from yargs
 */
export function validateCliArgs(args: unknown): CliArgs {
    try {
        return CliArgsSchema.parse(args);
    } catch (error) {
        const err = error as Error;
        console.error('❌ Invalid CLI arguments:', err.message);
        throw new Error('Invalid CLI arguments provided.');
    }
}

/**
 * Validates interactive answers from inquirer
 */
export function validateInquirerAnswers(answers: unknown): InquirerAnswers {
    try {
        return InquirerAnswersSchema.parse(answers);
    } catch (error) {
        const err = error as Error;
        console.error('❌ Invalid interactive answers:', err.message);
        throw new Error('Invalid selections made in interactive mode.');
    }
}

/**
 * Validates integration options
 */
export function validateIntegrationOptions(options: unknown): IntegrationOptions {
    try {
        return IntegrationOptionsSchema.parse(options);
    } catch (error) {
        const err = error as Error;
        console.error('❌ Invalid integration options:', err.message);
        throw new Error('Invalid integration options provided.');
    }
}