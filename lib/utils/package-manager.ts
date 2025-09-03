/**
 * @fileoverview Package management utilities
 * @description Utilities for managing package.json and dependencies
 */

import { readJsonFile, writeJsonFile } from './file-operations.ts';

export interface PackageJsonData {
    scripts?: Record<string, string>;
    prisma?: Record<string, unknown>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    [key: string]: unknown;
}

/**
 * Update package.json scripts safely
 */
export async function updatePackageJsonScripts(newScripts: Record<string, string>): Promise<void> {
    const packageJsonData = await readJsonFile('package.json', 'package.json') as PackageJsonData;

    // Simple validation - just ensure it's an object
    if (!packageJsonData || typeof packageJsonData !== 'object') {
        throw new Error('Invalid package.json structure');
    }

    const packageJson: PackageJsonData = {
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
 */
export async function updatePackageJsonPrisma(prismaConfig: Record<string, unknown>): Promise<void> {
    const packageJsonData = await readJsonFile('package.json', 'package.json') as PackageJsonData;

    // Simple validation - just ensure it's an object
    if (!packageJsonData || typeof packageJsonData !== 'object') {
        throw new Error('Invalid package.json structure');
    }

    const packageJson: PackageJsonData = {
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
 */
export async function dependenciesExist(dependencies: string[]): Promise<boolean> {
    try {
        const packageJsonData = await readJsonFile(
            'package.json',
            'package.json'
        ) as PackageJsonData;
        
        const allDeps = {
            ...(packageJsonData.dependencies || {}),
            ...(packageJsonData.devDependencies || {})
        };

        return dependencies.every((dep) => dep in allDeps);
    } catch {
        return false;
    }
}