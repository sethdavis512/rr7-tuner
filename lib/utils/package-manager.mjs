/**
 * @fileoverview Package management utilities
 * @description Utilities for managing package.json and dependencies
 */

import { readJsonFile, writeJsonFile } from './file-operations.mjs';
import { validatePackageJson } from '../validation/validators.mjs';

/**
 * Update package.json scripts safely
 * @param {object} newScripts - Scripts to add/update
 * @returns {Promise<void>}
 */
export async function updatePackageJsonScripts(newScripts) {
    const packageJsonData = await readJsonFile('package.json', 'package.json');
    const packageJson = validatePackageJson(packageJsonData);
    
    packageJson.scripts = {
        ...packageJson.scripts,
        ...newScripts
    };
    
    await writeJsonFile('package.json', packageJson);
}

/**
 * Update package.json prisma configuration
 * @param {object} prismaConfig - Prisma configuration to add/update
 * @returns {Promise<void>}
 */
export async function updatePackageJsonPrisma(prismaConfig) {
    const packageJsonData = await readJsonFile('package.json', 'package.json');
    const packageJson = validatePackageJson(packageJsonData);
    
    packageJson.prisma = {
        ...packageJson.prisma,
        ...prismaConfig
    };
    
    await writeJsonFile('package.json', packageJson);
}