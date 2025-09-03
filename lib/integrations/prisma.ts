/**
 * @fileoverview Prisma integration module
 * @description Complete Prisma setup following the official React Router 7 guide
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
    updatePackageJsonPrisma,
    dependenciesExist
} from '../utils/package-manager.ts';
import { fileExists, readJsonFile, updateRoutesFile } from '../utils/file-operations.ts';

/**
 * Integrate Prisma ORM following React Router 7 guide
 */
export async function integratePrisma(
    includeRoutes: boolean = true,
    databaseType: string = 'postgresql'
): Promise<void> {
    console.log(
        `Integrating Prisma ORM with ${databaseType.toUpperCase()} following React Router 7 guide...`
    );

    // Check if Prisma is already set up
    const prismaFolderExists = await fileExists('prisma');
    const prismaSchemaExists = await fileExists('prisma/schema.prisma');
    const prismaClientExists = await fileExists('app/lib/prisma.ts');
    const prismaDepsExist = await dependenciesExist([
        'prisma',
        '@prisma/client',
        '@prisma/extension-accelerate'
    ]);

    // Step 1: Install Prisma dependencies (exact from tutorial)
    if (prismaDepsExist) {
        printWarning(
            'Prisma dependencies already installed, skipping installation'
        );
    } else {
        printInstall('Installing Prisma dependencies');
        await $`npm install prisma @prisma/client @prisma/extension-accelerate`;
    }

    // Step 2: Initialize Prisma (skip if folder already exists)
    if (prismaFolderExists) {
        printWarning('Prisma folder already exists, skipping initialization');
    } else {
        printStep('Initializing Prisma');
        await $`npx prisma init`;
    }

    // Step 3: Create the exact schema from the tutorial
    if (prismaSchemaExists) {
        printWarning('Prisma schema already exists, skipping schema creation');
    } else {
        printStep('Creating Prisma schema');
        await createPrismaSchema(databaseType);
        printSuccess('Prisma schema created');
    }

    // Step 4: Create the Prisma client configuration
    if (prismaClientExists) {
        printWarning('Prisma client already exists, skipping client creation');
    } else {
        printStep('Creating Prisma client configuration');
        await $`mkdir -p app/lib`;
        await createPrismaClient();
        printSuccess('Prisma client configuration created');
    }

    // Step 5: Create seed file
    const seedExists = await fileExists('prisma/seed.ts');
    if (seedExists) {
        printWarning('Prisma seed file already exists, skipping seed creation');
    } else {
        printStep('Creating seed file');
        await createPrismaSeed();
        printSuccess('Seed file created');
    }

    // Step 6: Create example routes (optional)
    if (includeRoutes) {
        const routesExist = await fileExists('app/routes/posts.tsx');
        if (routesExist) {
            printWarning(
                'Example routes already exist, skipping route creation'
            );
        } else {
            printStep('Creating example routes');
            await $`mkdir -p app/routes`;
            await createPrismaRoutes();
            printSuccess('Example routes created');
        }

        // Step 6a: Register routes in routes.ts if it exists
        printStep('Registering routes in routes.ts');
        await updateRoutesFile([
            { path: '/posts', file: 'routes/posts.tsx' },
            { path: '/posts/:postId', file: 'routes/posts.$postId.tsx' },
            { path: '/posts/new', file: 'routes/posts.new.tsx' }
        ]);
        printSuccess('Routes registered successfully');
    }

    // Step 7: Update package.json with Prisma scripts (check if scripts already exist)
    const packageJsonData = await readJsonFile('package.json', 'package.json') as Record<string, any>;
    const existingScripts = packageJsonData.scripts || {};
    const prismaScripts = {
        'db:generate': 'prisma generate',
        'db:push': 'prisma db push',
        'db:seed': 'bun prisma/seed.ts'
    };

    const scriptsExist = Object.keys(prismaScripts).every(
        (script) => script in existingScripts
    );

    if (scriptsExist) {
        printWarning(
            'Prisma scripts already exist in package.json, skipping script updates'
        );
    } else {
        printStep('Updating package.json scripts');
        await updatePackageJsonScripts(prismaScripts);
        await updatePackageJsonPrisma({
            seed: 'bun prisma/seed.ts'
        });
        printSuccess('Package.json updated with Prisma scripts');
    }

    // Print next steps
    printNextSteps([
        'Set your DATABASE_URL in the .env file',
        'Run "bun run db:push" to push your schema to the database',
        'Run "bun run db:seed" to seed your database with example data',
        'Run "bun run db:generate" to generate the Prisma client',
        'Start your development server'
    ]);
}

/**
 * Create Prisma schema file
 */
async function createPrismaSchema(databaseType: string): Promise<void> {
    // Map database types to Prisma providers
    const providerMap: Record<string, string> = {
        postgresql: 'postgresql',
        mysql: 'mysql',
        sqlite: 'sqlite',
        mongodb: 'mongodb',
        sqlserver: 'sqlserver',
        cockroachdb: 'cockroachdb'
    };

    const provider = providerMap[databaseType] || 'postgresql';

    const schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`;

    await fs.writeFile('prisma/schema.prisma', schema);
}

/**
 * Create Prisma client configuration
 */
async function createPrismaClient(): Promise<void> {
    const prismaClient = `import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient().$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;`;

    await fs.writeFile('app/lib/prisma.ts', prismaClient);
}

/**
 * Create Prisma seed file
 */
async function createPrismaSeed(): Promise<void> {
    const seed = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.post.create({
    data: {
      title: 'Hello World',
      content: 'This is your first post!',
      published: true,
    },
  });

  await prisma.post.create({
    data: {
      title: 'Getting Started with React Router 7',
      content: 'Learn how to build amazing web applications with React Router 7.',
      published: false,
    },
  });

  console.log('Database has been seeded 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });`;

    await fs.writeFile('prisma/seed.ts', seed);
}

/**
 * Create example routes for Prisma
 */
async function createPrismaRoutes(): Promise<void> {
    // Posts list route
    const postsRoute = `import { prisma } from '~/lib/prisma';
import type { Route } from './+types/posts';

export async function loader({ request }: Route.LoaderArgs) {
    const posts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return { posts };
}

export default function Posts({ loaderData }: Route.ComponentProps) {
    const { posts } = loaderData;

    return (
        <div>
            <h1>Posts</h1>
            <a href="/posts/new">Create New Post</a>
            <ul>
                {posts.map((post) => (
                    <li key={post.id}>
                        <a href={\`/posts/\${post.id}\`}>
                            {post.title} {post.published ? '✅' : '⏳'}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}`;

    await fs.writeFile('app/routes/posts.tsx', postsRoute);

    // Individual post route
    const postRoute = `import { prisma } from '~/lib/prisma';
import type { Route } from './+types/posts.$postId';

export async function loader({ params }: Route.LoaderArgs) {
    const post = await prisma.post.findUnique({
        where: { id: params.postId },
    });

    if (!post) {
        throw new Response('Not Found', { status: 404 });
    }

    return { post };
}

export default function Post({ loaderData }: Route.ComponentProps) {
    const { post } = loaderData;

    return (
        <div>
            <h1>{post.title}</h1>
            <p>{post.content}</p>
            <p>Status: {post.published ? 'Published' : 'Draft'}</p>
            <p>Created: {new Date(post.createdAt).toLocaleDateString()}</p>
            <a href="/posts">← Back to Posts</a>
        </div>
    );
}`;

    await fs.writeFile('app/routes/posts.$postId.tsx', postRoute);

    // New post route
    const newPostRoute = `import { redirect } from '@react-router/node';
import { prisma } from '~/lib/prisma';
import type { Route } from './+types/posts.new';

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const published = formData.get('published') === 'on';

    await prisma.post.create({
        data: { title, content, published },
    });

    return redirect('/posts');
}

export default function NewPost() {
    return (
        <div>
            <h1>Create New Post</h1>
            <form method="post">
                <div>
                    <label htmlFor="title">Title:</label>
                    <input type="text" id="title" name="title" required />
                </div>
                <div>
                    <label htmlFor="content">Content:</label>
                    <textarea id="content" name="content"></textarea>
                </div>
                <div>
                    <label>
                        <input type="checkbox" name="published" />
                        Published
                    </label>
                </div>
                <button type="submit">Create Post</button>
            </form>
            <a href="/posts">← Back to Posts</a>
        </div>
    );
}`;

    await fs.writeFile('app/routes/posts.new.tsx', newPostRoute);
}