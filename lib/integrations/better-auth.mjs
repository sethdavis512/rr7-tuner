#!/usr/bin/env zx

/**
 * @fileoverview Better Auth integration modules
 * @description Better Auth setup with database adapters and authentication pages
 */

import { promises as fs } from 'fs';
import { printStep, printSuccess, printInstall, printWarning } from '../utils/console.mjs';
import { updatePackageJsonScripts } from '../utils/package-manager.mjs';
import { fileExists } from '../utils/file-operations.mjs';

/**
 * Integrate Better Auth with Prisma adapter
 * @returns {Promise<void>}
 */
export async function integrateBetterAuthWithPrisma() {
    console.log('Integrating Better Auth with Prisma adapter...');

    // Step 1: Install Better Auth dependencies
    printInstall('Installing Better Auth dependencies');
    await $`npm install better-auth`;

    // Step 2: Update Prisma schema to include auth tables
    printStep('Adding Better Auth tables to Prisma schema');
    
    // Read existing schema
    if (!(await fileExists('prisma/schema.prisma'))) {
        printWarning('No existing Prisma schema found. Please run Prisma integration first.');
        return;
    }

    await addBetterAuthToPrismaSchema();
    printSuccess('Prisma schema updated with Better Auth models');

    // Step 3: Create server-side auth configuration with Prisma adapter
    printStep('Creating server-side auth configuration');
    await $`mkdir -p app/lib`;
    await createBetterAuthServerConfigPrisma();
    printSuccess('Server auth configuration created with Prisma adapter');

    // Step 4: Update package.json scripts
    printStep('Updating package.json scripts');
    await updatePackageJsonScripts({
        "auth:migrate": "prisma migrate dev",
    });
    printSuccess('Package.json updated');

    // Step 5: Create shared components
    await createBetterAuthComponents();
    await updateEnvTemplate();
}

/**
 * Integrate Better Auth with Drizzle adapter
 * @returns {Promise<void>}
 */
export async function integrateBetterAuthWithDrizzle() {
    console.log('Integrating Better Auth with Drizzle adapter...');

    // Step 1: Install Better Auth dependencies
    printInstall('Installing Better Auth dependencies');
    await $`npm install better-auth`;

    // Step 2: Add Better Auth tables to Drizzle schema
    printStep('Adding Better Auth tables to Drizzle schema');
    
    // Read existing schema
    if (!(await fileExists('app/db/schema.ts'))) {
        printWarning('No existing Drizzle schema found. Please run Drizzle integration first.');
        return;
    }

    await addBetterAuthToDrizzleSchema();
    printSuccess('Drizzle schema updated with Better Auth tables');

    // Step 3: Create server-side auth configuration with Drizzle adapter
    printStep('Creating server-side auth configuration');
    await $`mkdir -p app/lib`;
    await createBetterAuthServerConfigDrizzle();
    printSuccess('Server auth configuration created with Drizzle adapter');

    // Step 4: Update package.json scripts
    printStep('Updating package.json scripts');
    await updatePackageJsonScripts({
        "auth:migrate": "drizzle-kit generate && drizzle-kit migrate",
    });
    printSuccess('Package.json updated');

    // Step 5: Create shared components
    await createBetterAuthComponents();
    await updateEnvTemplate();
}

/**
 * Integrate Better Auth standalone (no database detected)
 * @returns {Promise<void>}
 */
export async function integrateBetterAuth() {
    console.log('Integrating Better Auth standalone (no database detected)...');

    // Step 1: Install Better Auth dependencies
    printInstall('Installing Better Auth dependencies');
    await $`npm install better-auth`;

    // Step 2: Create server-side auth configuration
    printStep('Creating server-side auth configuration');
    await $`mkdir -p app/lib`;
    await createBetterAuthServerConfigStandalone();
    printSuccess('Server auth configuration created');

    // Step 3: Create shared components
    await createBetterAuthComponents();
    await updateEnvTemplate();
}

/**
 * Add Better Auth models to Prisma schema
 * @returns {Promise<void>}
 */
async function addBetterAuthToPrismaSchema() {
    const existingSchema = await fs.readFile('prisma/schema.prisma', 'utf8');

    const authModels = `

// Better Auth Models
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}`;

    const updatedSchema = existingSchema + authModels;
    await fs.writeFile('prisma/schema.prisma', updatedSchema);
}

/**
 * Add Better Auth tables to Drizzle schema
 * @returns {Promise<void>}
 */
async function addBetterAuthToDrizzleSchema() {
    const existingSchema = await fs.readFile('app/db/schema.ts', 'utf8');

    // Update imports
    const updatedSchema = existingSchema.replace(
        `import { sqliteTable, integer, text, int } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';`,
        `import { sqliteTable, integer, text, int, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';`
    ) + `

// Better Auth Tables
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql\`(unixepoch())\`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql\`(unixepoch())\`).notNull(),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  providerProviderAccountIdUnique: unique().on(table.provider, table.providerAccountId),
}));

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  identifierTokenUnique: unique().on(table.identifier, table.token),
}));`;

    await fs.writeFile('app/db/schema.ts', updatedSchema);
}

/**
 * Create Better Auth server configuration with Prisma
 * @returns {Promise<void>}
 */
async function createBetterAuthServerConfigPrisma() {
    const authServer = `import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
});

export type User = typeof auth.$Infer.User;
export type Session = typeof auth.$Infer.Session;`;

    await fs.writeFile('app/lib/auth.server.ts', authServer);
}

/**
 * Create Better Auth server configuration with Drizzle
 * @returns {Promise<void>}
 */
async function createBetterAuthServerConfigDrizzle() {
    const authServer = `import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db";
import * as schema from "~/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
});

export type User = typeof auth.$Infer.User;
export type Session = typeof auth.$Infer.Session;`;

    await fs.writeFile('app/lib/auth.server.ts', authServer);
}

/**
 * Create Better Auth server configuration standalone
 * @returns {Promise<void>}
 */
async function createBetterAuthServerConfigStandalone() {
    const authServer = `import { betterAuth } from "better-auth";

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
    },
    // Add your database adapter here when ready
});

export type User = typeof auth.$Infer.User;
export type Session = typeof auth.$Infer.Session;`;

    await fs.writeFile('app/lib/auth.server.ts', authServer);
}

/**
 * Create Better Auth shared components and pages
 * @returns {Promise<void>}
 */
async function createBetterAuthComponents() {
    printStep('Creating authentication components');

    // Step 1: Create API route handler  
    printStep('Creating API route handler');
    await $`mkdir -p app/routes`;
    await createAuthApiRoute();
    printSuccess('API route handler created');

    // Step 2: Create client auth configuration
    printStep('Creating client auth configuration');
    await createAuthClient();
    printSuccess('Client auth configuration created');

    // Step 3: Create authentication pages
    printStep('Creating authentication pages');
    await createAuthPages();
    printSuccess('Authentication pages created');
}

/**
 * Create auth API route
 * @returns {Promise<void>}
 */
async function createAuthApiRoute() {
    const apiRoute = `import { auth } from '~/lib/auth.server';
import type { Route } from './+types/api.auth.$';

export async function loader({ request }: Route.LoaderArgs) {
    return auth.handler(request);
}

export async function action({ request }: Route.ActionArgs) {
    return auth.handler(request);
}`;

    await fs.writeFile('app/routes/api.auth.$.ts', apiRoute);
}

/**
 * Create auth client configuration
 * @returns {Promise<void>}
 */
async function createAuthClient() {
    const authClient = `import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NODE_ENV === "production" 
        ? "https://yourdomain.com" 
        : "http://localhost:3000"
});

export const {
    signIn,
    signOut,
    signUp,
    useSession,
} = authClient;`;

    await fs.writeFile('app/lib/auth-client.ts', authClient);
}

/**
 * Create authentication pages
 * @returns {Promise<void>}
 */
async function createAuthPages() {
    // Sign up page
    const signupPage = `import { Form, Link } from "react-router";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";
import type { Route } from "./+types/signup";

export default function SignUp() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await authClient.signUp.email({
                email,
                password,
                name,
            }, {
                onRequest: (ctx) => {
                    // Handle loading state
                },
                onSuccess: (ctx) => {
                    // Handle success - redirect will happen automatically
                },
                onError: (ctx) => {
                    alert(\`Sign up failed: \${ctx.error.message}\`);
                }
            });
        } catch (error) {
            console.error("Sign up error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Sign Up</h1>
            <Form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Signing up..." : "Sign Up"}
                </button>
            </Form>
            <p>
                Already have an account? <Link to="/signin">Sign in</Link>
            </p>
        </div>
    );
}`;

    await fs.writeFile('app/routes/signup.tsx', signupPage);

    const signinPage = `import { Form, Link } from "react-router";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";
import type { Route } from "./+types/signin";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await authClient.signIn.email({
                email,
                password,
            }, {
                onRequest: (ctx) => {
                    // Handle loading state
                },
                onSuccess: (ctx) => {
                    // Handle success - redirect will happen automatically
                },
                onError: (ctx) => {
                    alert(\`Sign in failed: \${ctx.error.message}\`);
                }
            });
        } catch (error) {
            console.error("Sign in error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Sign In</h1>
            <Form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </Form>
            <p>
                Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
        </div>
    );
}`;

    await fs.writeFile('app/routes/signin.tsx', signinPage);

    const dashboardPage = `import { Link } from "react-router";
import { useSession, signOut } from "~/lib/auth-client";
import type { Route } from "./+types/dashboard";

export default function Dashboard() {
    const { data: session, isPending } = useSession();

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/signin";
                }
            }
        });
    };

    if (isPending) {
        return <div>Loading...</div>;
    }

    if (!session) {
        return (
            <div>
                <h1>Access Denied</h1>
                <p>You must be signed in to view this page.</p>
                <Link to="/signin">Sign In</Link>
            </div>
        );
    }

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome, {session.user.name || session.user.email}!</p>
            <button onClick={handleSignOut}>Sign Out</button>
            <div>
                <h2>Navigation</h2>
                <ul>
                    <li><Link to="/posts">View Posts</Link></li>
                </ul>
            </div>
        </div>
    );
}`;

    await fs.writeFile('app/routes/dashboard.tsx', dashboardPage);
    printSuccess('Authentication pages created');
}

/**
 * Update .env template with auth variables
 * @returns {Promise<void>}
 */
async function updateEnvTemplate() {
    printStep('Updating .env template with auth variables');
    let envTemplate;
    try {
        envTemplate = await fs.readFile('.env.example', 'utf8');
    } catch {
        envTemplate = '';
    }
    
    const authEnvVars = `

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
`;

    await fs.writeFile('.env.example', envTemplate + authEnvVars);
    printSuccess('.env template updated with auth variables');
}