/**
 * @fileoverview Package management utilities
 * @description Utilities for managing package.json and dependencies
 */

import { readJsonFile, writeJsonFile } from './file-operations.mjs';

/**
 * Update package.json scripts safely
 * @param {object} newScripts - Scripts to add/update
 * @returns {Promise<void>}
 */
export async function updatePackageJsonScripts(newScripts) {
    const packageJsonData = await readJsonFile('package.json', 'package.json');

    // Simple validation - just ensure it's an object
    if (!packageJsonData || typeof packageJsonData !== 'object') {
        throw new Error('Invalid package.json structure');
    }

    const packageJson = {
        ...packageJsonData,
        scripts: {
            ...(packageJsonData.scripts || {}),
            ...newScripts
        }
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

    // Simple validation - just ensure it's an object
    if (!packageJsonData || typeof packageJsonData !== 'object') {
        throw new Error('Invalid package.json structure');
    }

    const packageJson = {
        ...packageJsonData,
        prisma: {
            ...(packageJsonData.prisma || {}),
            ...prismaConfig
        }
    };

    await writeJsonFile('package.json', packageJson);
}

/**
 * Check if dependencies are already installed
 * @param {string[]} dependencies - Array of dependency names to check
 * @returns {Promise<boolean>} True if all dependencies exist
 */
export async function dependenciesExist(dependencies) {
    try {
        const packageJsonData = await readJsonFile(
            'package.json',
            'package.json'
        );
        const allDeps = {
            ...(packageJsonData.dependencies || {}),
            ...(packageJsonData.devDependencies || {})
        };

        return dependencies.every((dep) => dep in allDeps);
    } catch {
        return false;
    }
}
