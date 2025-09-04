/**
 * @fileoverview Better Auth integration module
 * @description Better Auth setup with database adapters and authentication pages
 */

import { $ } from 'bun';
import { promises as fs } from 'fs';
import {
    printStep,
    printSuccess,
    printInstall,
    printNextSteps,
    printWarning
} from '../utils/console.ts';
import {
    updatePackageJsonScripts,
    dependenciesExist
} from '../utils/package-manager.ts';
import { fileExists, updateRoutesFile } from '../utils/file-operations.ts';

/**
 * Integrate Better Auth with Prisma adapter following React Router 7 patterns
 */
export async function integrateBetterAuthWithPrisma(): Promise<void> {
    console.log('Integrating Better Auth with Prisma adapter...');

    // Check if Better Auth is already set up
    const authServerExists = await fileExists('app/lib/auth.server.ts');
    const authClientExists = await fileExists('app/lib/auth-client.ts');
    const authRouteExists = await fileExists('app/routes/api/auth/route.ts');
    const authDepsExist = await dependenciesExist([
        'better-auth',
        '@better-auth/cli'
    ]);

    // Step 1: Install Better Auth dependencies
    if (authDepsExist) {
        printWarning(
            'Better Auth dependencies already installed, skipping installation'
        );
    } else {
        printInstall('Installing Better Auth dependencies');
        await $`npm install better-auth @better-auth/cli`;
    }

    // Step 2: Create auth server configuration
    if (authServerExists) {
        printWarning('Auth server already exists, skipping server creation');
    } else {
        printStep('Creating Better Auth server configuration');
        await $`mkdir -p app/lib`;
        await createAuthServer();
        printSuccess('Better Auth server configuration created');
    }

    // Step 3: Create auth client
    if (authClientExists) {
        printWarning('Auth client already exists, skipping client creation');
    } else {
        printStep('Creating Better Auth client');
        await createAuthClient();
        printSuccess('Better Auth client created');
    }

    // Step 4: Create API route handler
    if (authRouteExists) {
        printWarning('Auth API route already exists, skipping route creation');
    } else {
        printStep('Creating auth API routes');
        await $`mkdir -p app/routes/api/auth`;
        await createAuthApiRoute();
        printSuccess('Auth API routes created');
    }

    // Step 5: Generate database schema
    printStep('Generating Better Auth database schema');
    try {
        await $`npx @better-auth/cli@latest generate`;
        printSuccess('Database schema generated');
    } catch (error) {
        printWarning('Schema generation failed - you may need to run this manually after setting up your database');
    }

    // Step 6: Create authentication pages
    printStep('Creating authentication pages');
    await createAuthPages();
    printSuccess('Authentication pages created');

    // Step 7: Register auth routes
    printStep('Registering authentication routes');
    await updateRoutesFile([
        { path: '/api/auth/*', file: 'routes/api/auth/route.ts' },
        { path: '/sign-in', file: 'routes/auth/sign-in/route.tsx' },
        { path: '/sign-up', file: 'routes/auth/sign-up/route.tsx' },
        { path: '/dashboard', file: 'routes/dashboard/route.tsx' }
    ]);
    printSuccess('Authentication routes registered');

    // Step 8: Update package.json scripts
    printStep('Adding Better Auth scripts to package.json');
    await updatePackageJsonScripts({
        'auth:generate': 'npx @better-auth/cli@latest generate',
        'auth:migrate': 'npx @better-auth/cli@latest migrate'
    });
    printSuccess('Package.json updated with Better Auth scripts');

    // Print next steps
    printNextSteps([
        'Ensure your DATABASE_URL is set in the .env file',
        'Add BETTER_AUTH_SECRET to your .env file (use a long random string)',
        'Run "bun run auth:generate" to generate the database schema',
        'Run "bun run db:push" to apply schema changes to your database',
        'Visit /sign-up to create your first user account',
        'Start your development server and test authentication'
    ]);
}

/**
 * Create Better Auth server configuration with Prisma adapter
 */
async function createAuthServer(): Promise<void> {
    const authServer = `import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // Change this to match your database
    }),
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (update session every day)
    },
});

export type Session = typeof auth.$Infer.Session;`;

    await fs.writeFile('app/lib/auth.server.ts', authServer);
}

/**
 * Create Better Auth client configuration
 */
async function createAuthClient(): Promise<void> {
    const authClient = `import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000",
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
} = authClient;`;

    await fs.writeFile('app/lib/auth-client.ts', authClient);
}

/**
 * Create API route for Better Auth handler
 */
async function createAuthApiRoute(): Promise<void> {
    const apiRoute = `import { auth } from '~/lib/auth.server';
import type { Route } from './+types/route';

export async function loader({ request }: Route.LoaderArgs) {
    return auth.handler(request);
}

export async function action({ request }: Route.ActionArgs) {
    return auth.handler(request);
}`;

    await fs.writeFile('app/routes/api/auth/route.ts', apiRoute);
}

/**
 * Create authentication pages (sign-in, sign-up, dashboard)
 */
async function createAuthPages(): Promise<void> {
    // Create nested directories
    await $`mkdir -p app/routes/auth/sign-in`;
    await $`mkdir -p app/routes/auth/sign-up`;
    await $`mkdir -p app/routes/dashboard`;

    // Sign In Page
    const signInPage = `import { useState } from 'react';
import { authClient } from '~/lib/auth-client';
import type { Route } from './+types/route';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        await authClient.signIn.email(
            { email, password },
            {
                onSuccess: () => {
                    window.location.href = '/dashboard';
                },
                onError: (ctx) => {
                    setError(ctx.error.message || 'Sign in failed');
                    setLoading(false);
                }
            }
        );
    };

    return (
        <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
            <h1>Sign In</h1>
            <form onSubmit={handleSignIn}>
                {error && (
                    <div style={{ color: 'red', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>
            <p>
                Don't have an account? <a href="/sign-up">Sign up</a>
            </p>
        </div>
    );
}`;

    await fs.writeFile('app/routes/auth/sign-in/route.tsx', signInPage);

    // Sign Up Page
    const signUpPage = `import { useState } from 'react';
import { authClient } from '~/lib/auth-client';
import type { Route } from './+types/route';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        await authClient.signUp.email(
            { email, password, name },
            {
                onSuccess: () => {
                    window.location.href = '/dashboard';
                },
                onError: (ctx) => {
                    setError(ctx.error.message || 'Sign up failed');
                    setLoading(false);
                }
            }
        );
    };

    return (
        <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
            <h1>Sign Up</h1>
            <form onSubmit={handleSignUp}>
                {error && (
                    <div style={{ color: 'red', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>
            <p>
                Already have an account? <a href="/sign-in">Sign in</a>
            </p>
        </div>
    );
}`;

    await fs.writeFile('app/routes/auth/sign-up/route.tsx', signUpPage);

    // Dashboard Page
    const dashboardPage = `import { useEffect, useState } from 'react';
import { authClient } from '~/lib/auth-client';
import type { Route } from './+types/route';

export default function Dashboard() {
    const { data: session, isPending, error } = authClient.useSession();
    const [loading, setLoading] = useState(false);

    const handleSignOut = async () => {
        setLoading(true);
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = '/sign-in';
                },
            },
        });
    };

    if (isPending) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Please <a href="/sign-in">sign in</a> to view this page.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Dashboard</h1>
            <div style={{ marginBottom: '2rem' }}>
                <h2>Welcome, {session.user.name || session.user.email}!</h2>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Session created:</strong> {new Date(session.createdAt).toLocaleString()}</p>
            </div>
            <button
                onClick={handleSignOut}
                disabled={loading}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
            >
                {loading ? 'Signing Out...' : 'Sign Out'}
            </button>
        </div>
    );
}`;

    await fs.writeFile('app/routes/dashboard/route.tsx', dashboardPage);
}

/**
 * Create Drizzle database client for different providers
 */
async function createDrizzleDbClient(databaseType: string): Promise<void> {
    // Map database types to Drizzle providers and imports
    const providerConfig = getDrizzleProviderConfig(databaseType);
    
    const dbClient = `${providerConfig.imports}

${providerConfig.clientSetup}

export { db };`;

    await fs.writeFile('app/lib/db.ts', dbClient);
}

/**
 * Get Drizzle provider configuration based on database type
 */
function getDrizzleProviderConfig(databaseType: string) {
    switch (databaseType) {
        case 'postgres':
        case 'neon':
            return {
                imports: `import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';`,
                clientSetup: `const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);`
            };
        
        case 'vercel-postgres':
            return {
                imports: `import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';`,
                clientSetup: `export const db = drizzle(sql);`
            };
        
        case 'supabase':
            return {
                imports: `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';`,
                clientSetup: `const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
export const db = drizzle(sql);`
            };
        
        case 'planetscale':
            return {
                imports: `import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { Client } from '@planetscale/database';`,
                clientSetup: `const client = new Client({
  url: process.env.DATABASE_URL!,
});
export const db = drizzle(client);`
            };
        
        case 'turso':
            return {
                imports: `import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';`,
                clientSetup: `const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
export const db = drizzle(client);`
            };
        
        case 'd1':
            return {
                imports: `import { drizzle } from 'drizzle-orm/d1';`,
                clientSetup: `// In a Cloudflare Worker environment
// The D1 binding is available via env.DB
export const db = (env: any) => drizzle(env.DB);`
            };
        
        default: // sqlite
            return {
                imports: `import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';`,
                clientSetup: `const sqlite = new Database(process.env.DATABASE_URL || 'sqlite.db');
export const db = drizzle(sqlite);`
            };
    }
}

/**
 * Create Better Auth server configuration with Drizzle adapter
 */
async function createAuthServerForDrizzle(databaseType: string): Promise<void> {
    // Map database type to Drizzle provider string
    const providerMap: Record<string, string> = {
        'postgres': 'pg',
        'neon': 'pg',
        'vercel-postgres': 'pg',
        'supabase': 'pg',
        'planetscale': 'mysql',
        'turso': 'sqlite',
        'd1': 'sqlite',
        'sqlite': 'sqlite'
    };

    const provider = providerMap[databaseType] || 'sqlite';

    const authServer = `import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "${provider}",
    }),
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (update session every day)
    },
});

export type Session = typeof auth.$Infer.Session;`;

    await fs.writeFile('app/lib/auth.server.ts', authServer);
}

/**
 * Integrate Better Auth with Drizzle adapter following React Router 7 patterns
 */
export async function integrateBetterAuthWithDrizzle(databaseType: string = 'turso'): Promise<void> {
    console.log(`Integrating Better Auth with Drizzle adapter (${databaseType.toUpperCase()})...`);

    // Check if Better Auth is already set up
    const authServerExists = await fileExists('app/lib/auth.server.ts');
    const authClientExists = await fileExists('app/lib/auth-client.ts');
    const authRouteExists = await fileExists('app/routes/api/auth/route.ts');
    const drizzleDbExists = await fileExists('app/lib/db.ts');
    const authDepsExist = await dependenciesExist([
        'better-auth',
        '@better-auth/cli'
    ]);

    // Step 1: Install Better Auth dependencies
    if (authDepsExist) {
        printWarning(
            'Better Auth dependencies already installed, skipping installation'
        );
    } else {
        printInstall('Installing Better Auth dependencies');
        await $`npm install better-auth @better-auth/cli`;
    }

    // Step 2: Create Drizzle database client if it doesn't exist
    if (drizzleDbExists) {
        printWarning('Drizzle database client already exists, skipping creation');
    } else {
        printStep('Creating Drizzle database client');
        await $`mkdir -p app/lib`;
        await createDrizzleDbClient(databaseType);
        printSuccess('Drizzle database client created');
    }

    // Step 3: Create auth server configuration
    if (authServerExists) {
        printWarning('Auth server already exists, skipping server creation');
    } else {
        printStep('Creating Better Auth server configuration with Drizzle');
        await createAuthServerForDrizzle(databaseType);
        printSuccess('Better Auth server configuration created');
    }

    // Step 4: Create auth client
    if (authClientExists) {
        printWarning('Auth client already exists, skipping client creation');
    } else {
        printStep('Creating Better Auth client');
        await createAuthClient();
        printSuccess('Better Auth client created');
    }

    // Step 5: Create API route handler
    if (authRouteExists) {
        printWarning('Auth API route already exists, skipping route creation');
    } else {
        printStep('Creating auth API routes');
        await $`mkdir -p app/routes/api/auth`;
        await createAuthApiRoute();
        printSuccess('Auth API routes created');
    }

    // Step 6: Generate database schema
    printStep('Generating Better Auth database schema for Drizzle');
    try {
        await $`npx @better-auth/cli@latest generate`;
        printSuccess('Database schema generated');
    } catch (error) {
        printWarning('Schema generation failed - you may need to run this manually after setting up your database');
    }

    // Step 7: Create authentication pages
    printStep('Creating authentication pages');
    await createAuthPages();
    printSuccess('Authentication pages created');

    // Step 8: Register auth routes
    printStep('Registering authentication routes');
    await updateRoutesFile([
        { path: '/api/auth/*', file: 'routes/api/auth/route.ts' },
        { path: '/sign-in', file: 'routes/auth/sign-in/route.tsx' },
        { path: '/sign-up', file: 'routes/auth/sign-up/route.tsx' },
        { path: '/dashboard', file: 'routes/dashboard/route.tsx' }
    ]);
    printSuccess('Authentication routes registered');

    // Step 9: Update package.json scripts
    printStep('Adding Better Auth scripts to package.json');
    await updatePackageJsonScripts({
        'auth:generate': 'npx @better-auth/cli@latest generate',
        'auth:migrate': 'npx @better-auth/cli@latest migrate',
        'db:generate': 'drizzle-kit generate',
        'db:migrate': 'drizzle-kit migrate'
    });
    printSuccess('Package.json updated with Better Auth and Drizzle scripts');

    // Print next steps
    printNextSteps([
        'Ensure your DATABASE_URL is set in the .env file',
        'Add BETTER_AUTH_SECRET to your .env file (use a long random string)',
        'Run "bun run db:generate" to generate Drizzle migrations',
        'Run "bun run db:migrate" to apply migrations to your database',
        'Run "bun run auth:generate" to generate the Better Auth schema',
        'Visit /sign-up to create your first user account',
        'Start your development server and test authentication'
    ]);
}

/**
 * Integrate Better Auth standalone (without external ORM) following React Router 7 patterns
 */
export async function integrateBetterAuth(): Promise<void> {
    console.log('Integrating Better Auth standalone with SQLite...');

    // Check if Better Auth is already set up
    const authServerExists = await fileExists('app/lib/auth.server.ts');
    const authClientExists = await fileExists('app/lib/auth-client.ts');
    const authRouteExists = await fileExists('app/routes/api/auth/route.ts');
    const authDepsExist = await dependenciesExist([
        'better-auth',
        '@better-auth/cli'
    ]);

    // Step 1: Install Better Auth dependencies
    if (authDepsExist) {
        printWarning(
            'Better Auth dependencies already installed, skipping installation'
        );
    } else {
        printInstall('Installing Better Auth dependencies with SQLite driver');
        await $`npm install better-auth @better-auth/cli better-sqlite3`;
        await $`npm install --save-dev @types/better-sqlite3`;
    }

    // Step 2: Create auth server configuration
    if (authServerExists) {
        printWarning('Auth server already exists, skipping server creation');
    } else {
        printStep('Creating Better Auth server configuration with SQLite');
        await $`mkdir -p app/lib`;
        await createStandaloneAuthServer();
        printSuccess('Better Auth server configuration created');
    }

    // Step 3: Create auth client
    if (authClientExists) {
        printWarning('Auth client already exists, skipping client creation');
    } else {
        printStep('Creating Better Auth client');
        await createAuthClient();
        printSuccess('Better Auth client created');
    }

    // Step 4: Create API route handler
    if (authRouteExists) {
        printWarning('Auth API route already exists, skipping route creation');
    } else {
        printStep('Creating auth API routes');
        await $`mkdir -p app/routes/api/auth`;
        await createAuthApiRoute();
        printSuccess('Auth API routes created');
    }

    // Step 5: Generate database schema
    printStep('Generating Better Auth database schema');
    try {
        await $`npx @better-auth/cli@latest generate`;
        printSuccess('Database schema generated');
    } catch (error) {
        printWarning('Schema generation failed - you may need to run this manually after setup');
    }

    // Step 6: Create authentication pages
    printStep('Creating authentication pages');
    await createAuthPages();
    printSuccess('Authentication pages created');

    // Step 7: Register auth routes
    printStep('Registering authentication routes');
    await updateRoutesFile([
        { path: '/api/auth/*', file: 'routes/api/auth/route.ts' },
        { path: '/sign-in', file: 'routes/auth/sign-in/route.tsx' },
        { path: '/sign-up', file: 'routes/auth/sign-up/route.tsx' },
        { path: '/dashboard', file: 'routes/dashboard/route.tsx' }
    ]);
    printSuccess('Authentication routes registered');

    // Step 8: Create .env template
    printStep('Creating environment configuration template');
    await createEnvTemplate();
    printSuccess('Environment template created');

    // Step 9: Update package.json scripts
    printStep('Adding Better Auth scripts to package.json');
    await updatePackageJsonScripts({
        'auth:generate': 'npx @better-auth/cli@latest generate',
        'auth:migrate': 'npx @better-auth/cli@latest migrate'
    });
    printSuccess('Package.json updated with Better Auth scripts');

    // Print next steps
    printNextSteps([
        'Add BETTER_AUTH_SECRET to your .env file (use a long random string)',
        'Optionally set DATABASE_URL in .env (defaults to ./database.sqlite)',
        'Run "bun run auth:generate" to generate the database schema',
        'Visit /sign-up to create your first user account',
        'Start your development server and test authentication',
        'For production, consider switching to PostgreSQL or MySQL'
    ]);
}

/**
 * Create Better Auth server configuration for standalone setup with SQLite
 */
async function createStandaloneAuthServer(): Promise<void> {
    const authServer = `import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

// Create or connect to SQLite database
const db = new Database(process.env.DATABASE_URL || "./database.sqlite");

export const auth = betterAuth({
    database: db,
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (update session every day)
    },
    // Add additional configuration as needed
    trustedOrigins: [
        process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000"
    ],
});

export type Session = typeof auth.$Infer.Session;`;

    await fs.writeFile('app/lib/auth.server.ts', authServer);
}

/**
 * Create environment template file
 */
async function createEnvTemplate(): Promise<void> {
    const envTemplate = `# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-here-use-at-least-32-characters

# Database Configuration (optional - defaults to ./database.sqlite)
# DATABASE_URL=./database.sqlite

# For production, consider using a more robust database:
# DATABASE_URL=postgresql://username:password@localhost:5432/mydb
# DATABASE_URL=mysql://username:password@localhost:3306/mydb

# Application URL (for production)
# APP_URL=https://your-domain.com
`;

    const envExists = await fileExists('.env.example');
    if (envExists) {
        printWarning('.env.example already exists, skipping creation');
    } else {
        await fs.writeFile('.env.example', envTemplate);
    }
}