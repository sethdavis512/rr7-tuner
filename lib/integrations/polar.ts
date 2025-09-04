/**
 * @fileoverview Polar.sh integration module
 * @description Complete Polar.sh setup with Better Auth adapter for payments and subscriptions
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
 * Integrate Polar.sh payments and subscriptions with React Router 7
 */
export async function integratePolar(
    authType: string = 'better-auth'
): Promise<void> {
    console.log('Integrating Polar.sh payments and subscriptions...');

    // Check if Polar is already set up
    const checkoutRouteExists = await fileExists(
        'app/routes/checkout/route.ts'
    );
    const customerPortalExists = await fileExists(
        'app/routes/customer-portal/route.ts'
    );
    const webhookRouteExists = await fileExists(
        'app/routes/api/polar/webhooks/route.ts'
    );
    const polarConfigExists = await fileExists('app/lib/polar.server.ts');
    const polarDepsExist = await dependenciesExist(['@polar-sh/remix', 'zod']);

    // Step 1: Install Polar.sh dependencies
    if (polarDepsExist) {
        printWarning(
            'Polar.sh dependencies already installed, skipping installation'
        );
    } else {
        printInstall('Installing Polar.sh dependencies');
        await $`npm install @polar-sh/remix zod`;
    }

    // Step 2: Create Polar server configuration
    if (polarConfigExists) {
        printWarning('Polar server config already exists, skipping creation');
    } else {
        printStep('Creating Polar.sh server configuration');
        await $`mkdir -p app/lib`;
        await createPolarServerConfig();
        printSuccess('Polar.sh server configuration created');
    }

    // Step 3: Create checkout route handler
    if (checkoutRouteExists) {
        printWarning('Checkout route already exists, skipping creation');
    } else {
        printStep('Creating Polar.sh checkout handler');
        await $`mkdir -p app/routes/checkout`;
        await createCheckoutRoute();
        printSuccess('Checkout route created');
    }

    // Step 4: Create customer portal route
    if (customerPortalExists) {
        printWarning('Customer portal already exists, skipping creation');
    } else {
        printStep('Creating customer portal');
        await $`mkdir -p app/routes/customer-portal`;
        await createCustomerPortalRoute(authType);
        printSuccess('Customer portal created');
    }

    // Step 5: Create webhook handler
    if (webhookRouteExists) {
        printWarning('Webhook handler already exists, skipping creation');
    } else {
        printStep('Creating Polar.sh webhook handler');
        await $`mkdir -p app/routes/api/polar/webhooks`;
        await createWebhookRoute();
        printSuccess('Webhook handler created');
    }

    // Step 6: Create sample product pages
    printStep('Creating sample product pages');
    await createSampleProductPages();
    printSuccess('Sample product pages created');

    // Step 7: Register Polar routes
    printStep('Registering Polar.sh routes');
    await updateRoutesFile([
        { path: '/checkout', file: 'routes/checkout/route.ts' },
        { path: '/customer-portal', file: 'routes/customer-portal/route.ts' },
        {
            path: '/api/polar/webhooks',
            file: 'routes/api/polar/webhooks/route.ts'
        },
        { path: '/products', file: 'routes/products/route.tsx' },
        { path: '/pricing', file: 'routes/pricing/route.tsx' }
    ]);
    printSuccess('Polar.sh routes registered');

    // Step 8: Update package.json scripts
    printStep('Adding Polar.sh scripts to package.json');
    await updatePackageJsonScripts({
        'polar:check': 'echo "Check your Polar.sh dashboard for webhook status"'
    });
    printSuccess('Package.json updated with Polar.sh scripts');

    // Step 9: Create environment template
    printStep('Creating environment configuration template');
    await createPolarEnvTemplate();
    printSuccess('Environment template created');

    // Print next steps
    printNextSteps([
        'Set up your Polar.sh account at https://polar.sh',
        'Add POLAR_ACCESS_TOKEN to your .env file (get from Polar dashboard)',
        'Add POLAR_WEBHOOK_SECRET to your .env file',
        'Configure webhook endpoint: /api/polar/webhooks in your Polar dashboard',
        'Create products in your Polar dashboard',
        'Update SUCCESS_URL and other environment variables',
        'Visit /products to see sample product integration',
        'Visit /pricing to see subscription plans',
        'Test checkout flow with /checkout?products=YOUR_PRODUCT_ID'
    ]);
}

/**
 * Create Polar.sh server configuration
 */
async function createPolarServerConfig(): Promise<void> {
    const polarConfig = `import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
    POLAR_ACCESS_TOKEN: z.string().min(1, 'POLAR_ACCESS_TOKEN is required'),
    POLAR_WEBHOOK_SECRET: z.string().min(1, 'POLAR_WEBHOOK_SECRET is required'),
    SUCCESS_URL: z.string().url().optional(),
    POLAR_SERVER: z.enum(['sandbox', 'production']).default('sandbox'),
});

// Validate environment variables
export const env = envSchema.parse({
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    SUCCESS_URL: process.env.SUCCESS_URL || \`\${process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000'}/success\`,
    POLAR_SERVER: process.env.POLAR_SERVER as 'sandbox' | 'production',
});

// Polar configuration object
export const polarConfig = {
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: env.POLAR_SERVER,
    successUrl: env.SUCCESS_URL,
    webhookSecret: env.POLAR_WEBHOOK_SECRET,
};

// Helper function to get customer ID based on auth type
export function getCustomerId(request: Request, authType: string = 'better-auth'): string | null {
    // This is a placeholder - implement based on your auth system
    // For Better Auth, you'd extract this from the session
    // Example implementation would depend on your auth setup
    
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    
    if (customerId) {
        return customerId;
    }
    
    // TODO: Implement proper customer ID resolution from session
    // if (authType === 'better-auth') {
    //     // Extract from Better Auth session
    //     return extractFromBetterAuthSession(request);
    // }
    
    return null;
}

// Helper function to format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount / 100); // Polar amounts are in cents
}

// Common product interface
export interface PolarProduct {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    type: 'one_time' | 'recurring';
    interval?: 'month' | 'year';
}`;

    await fs.writeFile('app/lib/polar.server.ts', polarConfig);
}

/**
 * Create checkout route handler
 */
async function createCheckoutRoute(): Promise<void> {
    const checkoutRoute = `import { Checkout } from "@polar-sh/remix";
import { polarConfig } from "~/lib/polar.server";
import type { Route } from './+types/route';

export const loader = Checkout({
    accessToken: polarConfig.accessToken,
    successUrl: polarConfig.successUrl,
    server: polarConfig.server,
    theme: "system", // Options: "light", "dark", "system"
});

// Optional: Add a component for direct navigation to checkout
export default function CheckoutPage() {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Redirecting to Checkout...</h1>
            <p>You should be automatically redirected to the Polar checkout.</p>
            <p>If not, please check the URL parameters and try again.</p>
        </div>
    );
}`;

    await fs.writeFile('app/routes/checkout/route.ts', checkoutRoute);
}

/**
 * Create customer portal route
 */
async function createCustomerPortalRoute(authType: string): Promise<void> {
    const customerPortalRoute = `import { CustomerPortal } from "@polar-sh/remix";
import { polarConfig, getCustomerId } from "~/lib/polar.server";
import type { Route } from './+types/route';

export const loader = CustomerPortal({
    accessToken: polarConfig.accessToken,
    getCustomerId: (request) => getCustomerId(request, "${authType}"),
    server: polarConfig.server,
});

// Optional: Add a component for the customer portal page
export default function CustomerPortalPage() {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Customer Portal</h1>
            <p>Loading your account information...</p>
            <p>Here you can view your orders, subscriptions, and manage your account.</p>
        </div>
    );
}`;

    await fs.writeFile(
        'app/routes/customer-portal/route.ts',
        customerPortalRoute
    );
}

/**
 * Create webhook handler route
 */
async function createWebhookRoute(): Promise<void> {
    const webhookRoute = `import { Webhooks } from "@polar-sh/remix";
import { polarConfig } from "~/lib/polar.server";
import type { Route } from './+types/route';

export const action = Webhooks({
    webhookSecret: polarConfig.webhookSecret,
    
    // Catch-all handler for any webhook event
    onPayload: async (payload) => {
        console.log('Received Polar webhook:', payload.type, payload.data);
        
        // Log webhook for debugging (remove in production)
        console.log('Full webhook payload:', JSON.stringify(payload, null, 2));
        
        return new Response('Webhook received', { status: 200 });
    },
    
    // Specific event handlers
    onCheckoutCreated: async (payload) => {
        console.log('Checkout created:', payload.data.id);
        // Handle checkout creation logic
    },
    
    onCheckoutUpdated: async (payload) => {
        console.log('Checkout updated:', payload.data.id);
        // Handle checkout updates
    },
    
    onOrderCreated: async (payload) => {
        console.log('Order created:', payload.data.id);
        // Handle new order logic
        // This is where you might:
        // - Send confirmation emails
        // - Update user permissions
        // - Log the order in your database
    },
    
    onOrderPaid: async (payload) => {
        console.log('Order paid:', payload.data.id);
        // Handle successful payment logic
        // This is where you might:
        // - Grant access to digital products
        // - Send payment confirmations
        // - Update customer status
    },
    
    onSubscriptionCreated: async (payload) => {
        console.log('Subscription created:', payload.data.id);
        // Handle new subscription logic
    },
    
    onSubscriptionActive: async (payload) => {
        console.log('Subscription active:', payload.data.id);
        // Handle active subscription logic
        // Grant access to subscriber content
    },
    
    onSubscriptionCanceled: async (payload) => {
        console.log('Subscription canceled:', payload.data.id);
        // Handle subscription cancellation
        // You might want to send cancellation confirmation
    },
    
    onSubscriptionRevoked: async (payload) => {
        console.log('Subscription revoked:', payload.data.id);
        // Handle subscription revocation
        // Remove access to subscriber content
    },
    
    onRefundCreated: async (payload) => {
        console.log('Refund created:', payload.data.id);
        // Handle refund logic
    },
    
    onCustomerCreated: async (payload) => {
        console.log('Customer created:', payload.data.id);
        // Handle new customer logic
    },
    
    onCustomerUpdated: async (payload) => {
        console.log('Customer updated:', payload.data.id);
        // Handle customer updates
    },
    
    onBenefitGrantCreated: async (payload) => {
        console.log('Benefit grant created:', payload.data.id);
        // Handle benefit grants (like exclusive access)
    },
    
    onBenefitGrantRevoked: async (payload) => {
        console.log('Benefit grant revoked:', payload.data.id);
        // Handle benefit revocation
    }
});`;

    await fs.writeFile('app/routes/api/polar/webhooks/route.ts', webhookRoute);
}

/**
 * Create sample product pages
 */
async function createSampleProductPages(): Promise<void> {
    // Create products directory
    await $`mkdir -p app/routes/products`;
    await $`mkdir -p app/routes/pricing`;

    // Products page
    const productsPage = `import { Link } from "@remix-run/react";
import { formatCurrency, type PolarProduct } from "~/lib/polar.server";
import type { Route } from './+types/route';

// Sample products - replace with actual data from your Polar dashboard
const sampleProducts: PolarProduct[] = [
    {
        id: "replace-with-actual-product-id-1",
        name: "Starter Pack",
        description: "Perfect for individuals getting started",
        price: 999, // $9.99 in cents
        currency: "USD",
        type: "one_time"
    },
    {
        id: "replace-with-actual-product-id-2", 
        name: "Pro Plan",
        description: "For professionals who need more features",
        price: 2999, // $29.99 in cents
        currency: "USD",
        type: "recurring",
        interval: "month"
    },
    {
        id: "replace-with-actual-product-id-3",
        name: "Enterprise Suite", 
        description: "Complete solution for large teams",
        price: 9999, // $99.99 in cents
        currency: "USD",
        type: "one_time"
    }
];

export default function ProductsPage() {
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Our Products</h1>
            <p style={{ marginBottom: '2rem', color: '#666' }}>
                Choose the perfect solution for your needs. All payments are securely processed by Polar.
            </p>
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '2rem' 
            }}>
                {sampleProducts.map((product) => (
                    <div 
                        key={product.id}
                        style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            backgroundColor: '#fafafa'
                        }}
                    >
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{product.name}</h3>
                        <p style={{ color: '#666', marginBottom: '1rem' }}>
                            {product.description}
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {formatCurrency(product.price, product.currency)}
                            </span>
                            {product.type === 'recurring' && product.interval && (
                                <span style={{ color: '#666' }}> /{product.interval}</span>
                            )}
                        </div>
                        <Link
                            to={\`/checkout?products=\${product.id}\`}
                            style={{
                                display: 'inline-block',
                                backgroundColor: '#007bff',
                                color: 'white',
                                padding: '0.75rem 1.5rem',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold'
                            }}
                        >
                            {product.type === 'recurring' ? 'Subscribe' : 'Buy Now'}
                        </Link>
                    </div>
                ))}
            </div>
            
            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <h2>Need Help Choosing?</h2>
                <p style={{ marginBottom: '1rem' }}>
                    Check out our <Link to="/pricing">pricing page</Link> for detailed comparisons.
                </p>
                <p>
                    Questions? <a href="mailto:support@example.com">Contact our support team</a>
                </p>
            </div>
        </div>
    );
}`;

    await fs.writeFile('app/routes/products/route.tsx', productsPage);

    // Pricing page
    const pricingPage = `import { Link } from "@remix-run/react";
import { formatCurrency } from "~/lib/polar.server";
import type { Route } from './+types/route';

// Sample pricing tiers - replace with actual data from your Polar dashboard
const pricingTiers = [
    {
        name: "Free",
        price: 0,
        currency: "USD",
        type: "free" as const,
        description: "Perfect for trying out our service",
        features: [
            "Basic features",
            "Community support",
            "Up to 5 projects",
            "Limited storage"
        ],
        productId: null, // No product ID for free tier
        popular: false
    },
    {
        name: "Pro",
        price: 1999, // $19.99 in cents
        currency: "USD", 
        type: "recurring" as const,
        interval: "month",
        description: "For growing businesses",
        features: [
            "All basic features",
            "Priority support",
            "Unlimited projects",
            "Advanced analytics",
            "Team collaboration"
        ],
        productId: "replace-with-actual-pro-product-id",
        popular: true
    },
    {
        name: "Enterprise",
        price: 4999, // $49.99 in cents
        currency: "USD",
        type: "recurring" as const, 
        interval: "month",
        description: "For large organizations", 
        features: [
            "All Pro features",
            "Dedicated support",
            "Custom integrations",
            "Advanced security",
            "SLA guarantee",
            "Custom training"
        ],
        productId: "replace-with-actual-enterprise-product-id",
        popular: false
    }
];

export default function PricingPage() {
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1>Simple, Transparent Pricing</h1>
                <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '1rem auto' }}>
                    Choose the plan that's right for you. Upgrade or downgrade at any time.
                    All plans include our core features and reliable support.
                </p>
            </div>
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '2rem',
                marginBottom: '3rem'
            }}>
                {pricingTiers.map((tier) => (
                    <div 
                        key={tier.name}
                        style={{
                            border: tier.popular ? '2px solid #007bff' : '1px solid #e0e0e0',
                            borderRadius: '12px',
                            padding: '2rem',
                            backgroundColor: tier.popular ? '#f8f9ff' : '#ffffff',
                            position: 'relative',
                            boxShadow: tier.popular ? '0 4px 12px rgba(0, 123, 255, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        {tier.popular && (
                            <div style={{
                                position: 'absolute',
                                top: '-10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#007bff',
                                color: 'white',
                                padding: '0.25rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                            }}>
                                Most Popular
                            </div>
                        )}
                        
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                            {tier.name}
                        </h3>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                            {tier.description}
                        </p>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                {tier.price === 0 ? 'Free' : formatCurrency(tier.price, tier.currency)}
                            </span>
                            {tier.type === 'recurring' && tier.interval && (
                                <span style={{ color: '#666', fontSize: '1rem' }}> /{tier.interval}</span>
                            )}
                        </div>
                        
                        <ul style={{ 
                            listStyle: 'none', 
                            padding: 0, 
                            marginBottom: '2rem' 
                        }}>
                            {tier.features.map((feature, index) => (
                                <li key={index} style={{ 
                                    marginBottom: '0.75rem',
                                    paddingLeft: '1.5rem',
                                    position: 'relative'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '0',
                                        color: '#28a745'
                                    }}>✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        
                        {tier.type === 'free' ? (
                            <Link
                                to="/sign-up"
                                style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    backgroundColor: tier.popular ? '#007bff' : '#6c757d',
                                    color: 'white',
                                    padding: '0.75rem 1.5rem',
                                    textDecoration: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Get Started Free
                            </Link>
                        ) : (
                            <Link
                                to={\`/checkout?products=\${tier.productId}\`}
                                style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    backgroundColor: tier.popular ? '#007bff' : '#6c757d',
                                    color: 'white',
                                    padding: '0.75rem 1.5rem',
                                    textDecoration: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Subscribe Now
                            </Link>
                        )}
                    </div>
                ))}
            </div>
            
            <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px' 
            }}>
                <h2>Frequently Asked Questions</h2>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4>Can I change plans later?</h4>
                        <p style={{ color: '#666' }}>
                            Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                        </p>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4>What payment methods do you accept?</h4>
                        <p style={{ color: '#666' }}>
                            We accept all major credit cards, PayPal, and other payment methods through our secure payment processor, Polar.
                        </p>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4>Is there a free trial?</h4>
                        <p style={{ color: '#666' }}>
                            Our Free plan gives you access to core features indefinitely. You can upgrade to a paid plan when you're ready for more advanced features.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}`;

    await fs.writeFile('app/routes/pricing/route.tsx', pricingPage);
}

/**
 * Create environment template for Polar.sh
 */
async function createPolarEnvTemplate(): Promise<void> {
    const envTemplate = `
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=your-polar-access-token-here
POLAR_WEBHOOK_SECRET=your-webhook-secret-here
POLAR_SERVER=sandbox
SUCCESS_URL=http://localhost:3000/success

# Production Configuration (uncomment for production)
# POLAR_SERVER=production  
# SUCCESS_URL=https://your-domain.com/success
`;

    const envExists = await fileExists('.env.example');
    if (envExists) {
        // Append to existing .env.example
        const existingContent = await fs.readFile('.env.example', 'utf8');
        if (!existingContent.includes('POLAR_ACCESS_TOKEN')) {
            await fs.appendFile('.env.example', envTemplate);
        }
    } else {
        await fs.writeFile('.env.example', envTemplate.trim());
    }
}
