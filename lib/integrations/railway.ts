/**
 * @fileoverview Railway deployment integration module
 * @description Railway deployment setup for React Router 7 + Prisma projects
 */

import { $ } from 'bun';
import { promises as fs } from 'fs';
import {
    printStep,
    printSuccess,
    printWarning
} from '../utils/console.ts';
import {
    updatePackageJsonScripts
} from '../utils/package-manager.ts';
import { fileExists, readJsonFile } from '../utils/file-operations.ts';

/**
 * Integrate Railway deployment configuration
 */
export async function integrateRailway(): Promise<void> {
    console.log('Setting up Railway deployment configuration...');

    // Step 1: Create Railway configuration file
    const railwayConfigExists = await fileExists('railway.json');
    if (railwayConfigExists) {
        printWarning('railway.json already exists, skipping Railway config creation');
    } else {
        printStep('Creating Railway configuration');
        await createRailwayConfig();
        printSuccess('Railway configuration created');
    }

    // Step 2: Update package.json with Railway deployment scripts
    const packageJsonData = await readJsonFile('package.json', 'package.json') as Record<string, any>;
    const existingScripts = packageJsonData.scripts || {};

    const railwayScripts = {
        'build': 'react-router build',
        'start': 'react-router-serve ./build/server/index.js',
        'migrate:deploy': 'prisma migrate deploy',
        'postinstall': 'prisma generate'
    };

    const scriptsExist = Object.keys(railwayScripts).every(
        (script) => script in existingScripts
    );

    if (scriptsExist) {
        printWarning('Railway deployment scripts already exist in package.json, skipping script updates');
    } else {
        printStep('Updating package.json with Railway deployment scripts');
        await updatePackageJsonScripts(railwayScripts);
        printSuccess('Package.json updated with Railway deployment scripts');
    }

    // Step 3: Setup environment files
    await setupEnvironmentFiles();

    // Step 4: Update TypeScript configuration for Prisma paths
    await updateTypeScriptConfig();

    // Step 5: Update .gitignore for Railway deployment
    await updateGitignore();

    printSuccess('Railway deployment setup complete!');

    console.log('\n📋 Railway Deployment Next Steps:');
    console.log('1. Set your DATABASE_URL environment variable in Railway');
    console.log('2. Connect your GitHub repository to Railway');
    console.log('3. Deploy your application');
    console.log('4. Railway will automatically run migrations and generate Prisma client');
}

/**
 * Create Railway configuration file
 */
async function createRailwayConfig(): Promise<void> {
    const railwayConfig = {
        "$schema": "https://railway.app/railway.schema.json",
        "build": {
            "builder": "NIXPACKS",
            "buildCommand": "npm ci && npx prisma generate --generator client && npm run build"
        },
        "deploy": {
            "startCommand": "npx prisma migrate deploy && npm run start",
            "restartPolicyType": "ON_FAILURE",
            "restartPolicyMaxRetries": 10
        },
        "providers": ["node"]
    };

    await fs.writeFile('railway.json', JSON.stringify(railwayConfig, null, 2));
}

/**
 * Setup environment files for Railway deployment
 */
async function setupEnvironmentFiles(): Promise<void> {
    printStep('Setting up environment files');

    // Create .env.example if it doesn't exist
    const envExampleExists = await fileExists('.env.example');
    if (!envExampleExists) {
        await fs.writeFile('.env.example', 'DATABASE_URL=\n');
    }

    // Update .env if it doesn't contain DATABASE_URL
    const envExists = await fileExists('.env');
    if (envExists) {
        const envContent = await fs.readFile('.env', 'utf8');
        if (!envContent.includes('DATABASE_URL')) {
            await fs.appendFile('.env', '\n# Railway will override this in production\nDATABASE_URL="postgresql://user:password@localhost:5432/mydb"\n');
        }
    } else {
        await fs.writeFile('.env', '# Local development database\nDATABASE_URL="postgresql://user:password@localhost:5432/mydb"\n\n# Railway will override this in production\n');
    }

    printSuccess('Environment files configured');
}

/**
 * Update TypeScript configuration for Prisma generated client paths
 */
async function updateTypeScriptConfig(): Promise<void> {
    const tsconfigExists = await fileExists('tsconfig.json');
    if (!tsconfigExists) {
        printWarning('tsconfig.json not found, skipping TypeScript configuration');
        return;
    }

    printStep('Updating TypeScript configuration');

    try {
        const tsconfigContent = await fs.readFile('tsconfig.json', 'utf8');
        const tsconfig = JSON.parse(tsconfigContent);

        // Ensure compilerOptions exists
        tsconfig.compilerOptions = tsconfig.compilerOptions || {};

        // Add paths for Prisma generated client (Railway-compatible)
        tsconfig.compilerOptions.paths = tsconfig.compilerOptions.paths || {};
        tsconfig.compilerOptions.paths['~/generated/prisma/*'] = ['./app/generated/prisma/*'];

        // Ensure module resolution works
        tsconfig.compilerOptions.moduleResolution = 'node';
        tsconfig.compilerOptions.esModuleInterop = true;

        await fs.writeFile('tsconfig.json', JSON.stringify(tsconfig, null, 2));
        printSuccess('TypeScript configuration updated');
    } catch (error) {
        printWarning('Failed to update TypeScript configuration');
    }
}

/**
 * Update .gitignore for Railway deployment
 */
async function updateGitignore(): Promise<void> {
    printStep('Updating .gitignore');

    const gitignoreExists = await fileExists('.gitignore');
    let gitignoreContent = '';

    if (gitignoreExists) {
        gitignoreContent = await fs.readFile('.gitignore', 'utf8');
    }

    const railwayIgnoreEntries = [
        '.env',
        '/app/generated'
    ];

    let needsUpdate = false;
    const linesToAdd: string[] = [];

    for (const entry of railwayIgnoreEntries) {
        if (!gitignoreContent.includes(entry)) {
            linesToAdd.push(entry);
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
        const newContent = gitignoreContent + '\n' + linesToAdd.join('\n') + '\n';
        await fs.writeFile('.gitignore', newContent);
        printSuccess('.gitignore updated with Railway deployment entries');
    } else {
        printWarning('.gitignore already contains Railway deployment entries');
    }
}