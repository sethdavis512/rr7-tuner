#!/usr/bin/env zx

/**
 * @fileoverview Polar.sh integration module
 * @description Complete Polar.sh setup with Better Auth adapter for payments and subscriptions
 */

import { $ } from 'zx';
import { promises as fs } from 'fs';
import { printStep, printSuccess, printInstall, printWarning } from '../utils/console.mjs';
import { updateRoutesFile } from '../utils/file-operations.mjs';

/**
 * Integrate Polar.sh with Better Auth adapter
 * @param {string} authType - Authentication type (should be 'better-auth')
 * @returns {Promise<void>}
 */
export async function integratePolar(authType = 'better-auth') {
    console.log('Integrating Polar.sh payments and subscriptions...');

    if (authType !== 'better-auth') {
        printWarning('Polar.sh integration currently requires Better Auth. Skipping Polar integration.');
        return;
    }

    // Step 1: Install Polar.sh dependencies
    printInstall('Installing Polar.sh dependencies');
    await $`npm install @polar-sh/sdk @polar-sh/better-auth`;

    // Step 2: Update Better Auth configuration with Polar plugin
    printStep('Updating Better Auth configuration with Polar plugin');
    await updateBetterAuthWithPolar();
    printSuccess('Better Auth configuration updated with Polar plugin');

    // Step 3: Create Polar client configuration
    printStep('Creating Polar client configuration');
    await createPolarClientConfig();
    printSuccess('Polar client configuration created');

    // Step 4: Create Polar routes for React Router 7
    printStep('Creating Polar routes');
    await $`mkdir -p app/routes`;
    await createPolarRoutes();
    printSuccess('Polar routes created');

    // Step 4a: Register routes in routes.ts if it exists
    printStep('Registering Polar routes in routes.ts');
    await updateRoutesFile([
        { path: '/success', file: 'routes/success.tsx' },
        { path: '/portal', file: 'routes/portal.tsx' },
        { path: '/upgrade', file: 'routes/upgrade.tsx' }
    ]);
    printSuccess('Polar routes registered successfully');

    // Step 5: Update environment template
    printStep('Updating .env template with Polar variables');
    await updateEnvTemplateWithPolar();
    printSuccess('.env template updated with Polar variables');

    // Print setup instructions
    console.log('\n📋 Polar.sh Setup Instructions:');
    console.log('1. Create a Polar.sh account at https://polar.sh');
    console.log('2. Get your access token from dashboard settings');
    console.log('3. Set up webhook endpoints for payment events');
    console.log('4. Configure your products and pricing');
    console.log('5. Update environment variables in .env file');
    console.log('\n💡 Polar provides checkout, customer portal, usage tracking, and webhooks');
    console.log('🔗 Documentation: https://docs.polar.sh/integrate/sdk/adapters/better-auth');
}

/**
 * Update Better Auth server configuration to include Polar plugin
 * @returns {Promise<void>}
 */
async function updateBetterAuthWithPolar() {
    try {
        // Check if Better Auth server config exists
        const authServerPath = 'app/lib/auth.server.ts';
        let existingConfig = await fs.readFile(authServerPath, 'utf8');

        // Add Polar imports if not already present
        if (!existingConfig.includes('@polar-sh/better-auth')) {
            // Add Polar imports
            const polarImports = `import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

`;
            
            // Insert after Better Auth import
            existingConfig = existingConfig.replace(
                `import { betterAuth } from "better-auth";`,
                `import { betterAuth } from "better-auth";\n${polarImports}`
            );

            // Add Polar client configuration
            const polarClientConfig = `
// Polar.sh client configuration
const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

`;

            // Insert before auth configuration
            existingConfig = existingConfig.replace(
                'export const auth = betterAuth({',
                `${polarClientConfig}export const auth = betterAuth({`
            );

            // Add plugins array or update existing one
            if (existingConfig.includes('plugins: [')) {
                // Add to existing plugins array
                existingConfig = existingConfig.replace(
                    'plugins: [',
                    `plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: process.env.POLAR_PRODUCT_ID!,
                            slug: "pro"
                        }
                    ],
                    successUrl: "/success?checkout_id={CHECKOUT_ID}",
                    authenticatedUsersOnly: true
                }),
                portal(),
                usage(),
                webhooks({
                    secret: process.env.POLAR_WEBHOOK_SECRET!,
                    onCustomerStateChanged: (payload) => {
                        console.log('Customer state changed:', payload);
                    }
                })
            ]
        }),`
                );
            } else {
                // Add plugins array
                existingConfig = existingConfig.replace(
                    'export const auth = betterAuth({',
                    `export const auth = betterAuth({
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: process.env.POLAR_PRODUCT_ID!,
                            slug: "pro"
                        }
                    ],
                    successUrl: "/success?checkout_id={CHECKOUT_ID}",
                    authenticatedUsersOnly: true
                }),
                portal(),
                usage(),
                webhooks({
                    secret: process.env.POLAR_WEBHOOK_SECRET!,
                    onCustomerStateChanged: (payload) => {
                        console.log('Customer state changed:', payload);
                    }
                })
            ]
        })
    ],`
                );
            }

            await fs.writeFile(authServerPath, existingConfig);
        }
    } catch (error) {
        printWarning('Could not update Better Auth configuration. Please ensure Better Auth is integrated first.');
        throw error;
    }
}

/**
 * Create Polar client configuration
 * @returns {Promise<void>}
 */
async function createPolarClientConfig() {
    // Check if auth client exists and update it
    try {
        const authClientPath = 'app/lib/auth-client.ts';
        let existingConfig = await fs.readFile(authClientPath, 'utf8');

        // Add Polar client import if not present
        if (!existingConfig.includes('@polar-sh/better-auth')) {
            existingConfig = existingConfig.replace(
                `import { createAuthClient } from "better-auth/react";`,
                `import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";`
            );

            // Add Polar plugin to client
            if (existingConfig.includes('plugins: [')) {
                existingConfig = existingConfig.replace(
                    'plugins: [',
                    'plugins: [polarClient(), '
                );
            } else {
                existingConfig = existingConfig.replace(
                    'export const authClient = createAuthClient({',
                    `export const authClient = createAuthClient({
    plugins: [polarClient()],`
                );
            }

            await fs.writeFile(authClientPath, existingConfig);
        }
    } catch (error) {
        printWarning('Could not update auth client configuration.');
        throw error;
    }
}

/**
 * Create Polar-specific routes for React Router 7
 * @returns {Promise<void>}
 */
async function createPolarRoutes() {
    // Checkout success page
    const checkoutSuccessRoute = `import { useSearchParams, Link } from "react-router";
import type { Route } from "./+types/success";

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);
    const checkoutId = url.searchParams.get('checkout_id');
    
    if (!checkoutId) {
        throw new Response("Checkout ID not found", { status: 400 });
    }

    return { checkoutId };
}

export default function CheckoutSuccess({ loaderData }: Route.ComponentProps) {
    return (
        <div>
            <h1>🎉 Payment Successful!</h1>
            <p>Thank you for your purchase.</p>
            <p>Checkout ID: {loaderData.checkoutId}</p>
            <Link to="/dashboard">Go to Dashboard</Link>
        </div>
    );
}`;

    await fs.writeFile('app/routes/success.tsx', checkoutSuccessRoute);

    // Customer portal route
    const customerPortalRoute = `import { auth } from "~/lib/auth.server";
import type { Route } from "./+types/portal";
import { redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session) {
        return redirect("/signin");
    }

    // Redirect to Polar customer portal
    // The actual portal URL would be provided by Polar.sh
    return redirect(\`https://polar.sh/portal?customer_id=\${session.user.id}\`);
}`;

    await fs.writeFile('app/routes/portal.tsx', customerPortalRoute);

    // Upgrade/checkout route
    const upgradeRoute = `import { authClient } from "~/lib/auth-client";
import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/upgrade";

export default function Upgrade() {
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            await authClient.checkout({
                products: [process.env.POLAR_PRODUCT_ID || "your-product-id"]
            });
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Checkout failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Upgrade to Pro</h1>
            <p>Get access to premium features with our Pro plan.</p>
            
            <div>
                <h2>Pro Features:</h2>
                <ul>
                    <li>✅ Advanced analytics</li>
                    <li>✅ Priority support</li>
                    <li>✅ Custom integrations</li>
                    <li>✅ Unlimited projects</li>
                </ul>
            </div>

            <button onClick={handleUpgrade} disabled={loading}>
                {loading ? "Processing..." : "Upgrade Now"}
            </button>

            <Link to="/dashboard">← Back to Dashboard</Link>
        </div>
    );
}`;

    await fs.writeFile('app/routes/upgrade.tsx', upgradeRoute);
}

/**
 * Update .env template with Polar variables
 * @returns {Promise<void>}
 */
async function updateEnvTemplateWithPolar() {
    let envTemplate;
    try {
        envTemplate = await fs.readFile('.env.example', 'utf8');
    } catch {
        envTemplate = '';
    }
    
    const polarEnvVars = `

# Polar.sh Configuration
POLAR_ACCESS_TOKEN="your-polar-access-token-here"
POLAR_WEBHOOK_SECRET="your-webhook-secret-here"
POLAR_PRODUCT_ID="your-product-id-here"
`;

    await fs.writeFile('.env.example', envTemplate + polarEnvVars);
}