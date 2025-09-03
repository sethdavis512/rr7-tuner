/**
 * @fileoverview File operation utilities
 * @description Safe file operations with proper error handling
 */

import { promises as fs } from 'fs';

/**
 * Safely parse JSON string with proper error handling
 * @param {string} jsonString - JSON string to parse
 * @param {string} filename - Filename for error context
 * @returns {object} Parsed JSON object
 * @throws {Error} If JSON parsing fails
 */
export function safeParseJson(jsonString, filename = 'JSON') {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error(`❌ Failed to parse ${filename}:`, error.message);
        throw new Error(`Invalid JSON in ${filename}`);
    }
}

/**
 * Safely read and parse a JSON file
 * @param {string} filePath - Path to JSON file
 * @param {string} filename - Filename for error context
 * @returns {Promise<object>} Parsed JSON object
 */
export async function readJsonFile(filePath, filename = 'file') {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return safeParseJson(content, filename);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`${filename} not found at ${filePath}`);
        }
        throw error;
    }
}

/**
 * Safely write JSON file with proper formatting
 * @param {string} filePath - Path to write file
 * @param {object} data - Data to write
 * @returns {Promise<void>}
 */
export async function writeJsonFile(filePath, data) {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content);
}

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path to ensure
 * @returns {Promise<void>}
 */
export async function ensureDirectory(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        // Directory already exists, ignore error
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Update routes.ts file with new route configurations
 * @param {Array<{path: string, file: string}>} newRoutes - Array of route configurations to add
 * @returns {Promise<void>}
 */
export async function updateRoutesFile(newRoutes) {
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
        let allRoutes = [];
        if (existingRoutesContent) {
            allRoutes.push(existingRoutesContent);
        }
        allRoutes.push(...newRouteEntries);
        
        // Check if we need to import 'route' function
        const needsRouteImport = newRoutes.some(r => r.path !== '/');
        let importStatement = content.match(/import.*from "@react-router\/dev\/routes";/)[0];
        
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
        console.error('❌ Failed to update routes.ts:', error.message);
        throw error;
    }
}