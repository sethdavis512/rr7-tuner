/**
 * @fileoverview Input validation functions
 * @description Safe validation functions with proper error handling
 */

import {
    PackageJsonSchema,
    CliArgsSchema,
    InquirerAnswersSchema,
    IntegrationOptionsSchema
} from './schemas.mjs';

/**
 * Validates package.json data structure
 * @param {object} data - Raw package.json data
 * @returns {object} Validated package.json object
 * @throws {Error} If validation fails
 */
export function validatePackageJson(data) {
    try {
        return PackageJsonSchema.parse(data);
    } catch (error) {
        console.error('❌ Invalid package.json structure:', error.message);
        throw new Error('Failed to parse package.json. Please ensure it has valid JSON structure.');
    }
}

/**
 * Validates CLI arguments from yargs
 * @param {object} args - Raw CLI arguments
 * @returns {object} Validated CLI arguments
 * @throws {Error} If validation fails
 */
export function validateCliArgs(args) {
    try {
        return CliArgsSchema.parse(args);
    } catch (error) {
        console.error('❌ Invalid CLI arguments:', error.message);
        throw new Error('Invalid CLI arguments provided.');
    }
}

/**
 * Validates interactive answers from inquirer
 * @param {object} answers - Raw inquirer answers
 * @returns {object} Validated answers
 * @throws {Error} If validation fails
 */
export function validateInquirerAnswers(answers) {
    try {
        return InquirerAnswersSchema.parse(answers);
    } catch (error) {
        console.error('❌ Invalid interactive answers:', error.message);
        throw new Error('Invalid selections made in interactive mode.');
    }
}

/**
 * Validates integration options
 * @param {object} options - Integration options
 * @returns {object} Validated options
 * @throws {Error} If validation fails
 */
export function validateIntegrationOptions(options) {
    try {
        return IntegrationOptionsSchema.parse(options);
    } catch (error) {
        console.error('❌ Invalid integration options:', error.message);
        throw new Error('Invalid integration options provided.');
    }
}