/**
 * @fileoverview Input validation functions
 * @description Safe validation functions with proper error handling
 */

import {
    CliArgsSchema,
    InquirerAnswersSchema,
    type CliArgs,
    type InquirerAnswers
} from './schemas.ts';

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

