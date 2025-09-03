/**
 * @fileoverview File operation utilities
 * @description Safe file operations with proper error handling
 */

import { promises as fs } from 'fs';

export interface RouteConfig {
    path: string;
    file: string;
}

/**
 * Safely parse JSON string with proper error handling
 */
export function safeParseJson(jsonString: string, filename: string = 'JSON'): unknown {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        const err = error as Error;
        console.error(`❌ Failed to parse ${filename}:`, err.message);
        throw new Error(`Invalid JSON in ${filename}`);
    }
}

/**
 * Safely read and parse a JSON file
 */
export async function readJsonFile(filePath: string, filename: string = 'file'): Promise<unknown> {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return safeParseJson(content, filename);
    } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
            throw new Error(`${filename} not found at ${filePath}`);
        }
        throw error;
    }
}

/**
 * Safely write JSON file with proper formatting
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content);
}

/**
 * Ensure directory exists, create if it doesn't
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        const err = error as NodeJS.ErrnoException;
        // Directory already exists, ignore error
        if (err.code !== 'EEXIST') {
            throw error;
        }
    }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Update routes.ts file with new route configurations
 */
export async function updateRoutesFile(newRoutes: RouteConfig[]): Promise<void> {
    const routesPath = 'app/routes.ts';
    
    // Only proceed if routes.ts exists
    if (!(await fileExists(routesPath))) {
        return;
    }

    try {
        const content = await fs.readFile(routesPath, 'utf8');
        
        // Parse existing routes by finding the export default array
        const exportMatch = content.match(/export default \[(.*?)\] satisfies RouteConfig;/s);
        if (!exportMatch) {
            throw new Error('Could not parse existing routes configuration');
        }
        
        const existingRoutesContent = exportMatch[1].trim();
        
        // Generate new route entries
        const newRouteEntries = newRoutes.map(route => {
            if (route.path === '/') {
                return `index("${route.file}")`;
            } else {
                return `route("${route.path}", "${route.file}")`;
            }
        });
        
        // Combine existing and new routes
        const allRoutes: string[] = [];
        if (existingRoutesContent) {
            allRoutes.push(existingRoutesContent);
        }
        allRoutes.push(...newRouteEntries);
        
        // Check if we need to import 'route' function
        const needsRouteImport = newRoutes.some(r => r.path !== '/');
        const importMatch = content.match(/import.*from "@react-router\/dev\/routes";/);
        if (!importMatch) {
            throw new Error('Could not find import statement for routes');
        }
        
        let importStatement = importMatch[0];
        if (needsRouteImport && !importStatement.includes('route')) {
            importStatement = importStatement.replace(
                'index',
                'route, index'
            );
        }
        
        // Reconstruct the file
        const newContent = `${importStatement}

export default [${allRoutes.join(',\n  ')}] satisfies RouteConfig;`;
        
        await fs.writeFile(routesPath, newContent);
    } catch (error) {
        const err = error as Error;
        console.error('❌ Failed to update routes.ts:', err.message);
        throw error;
    }
}