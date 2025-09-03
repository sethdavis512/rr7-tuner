#!/usr/bin/env zx

/**
 * @fileoverview Prisma integration module
 * @description Complete Prisma setup following the official React Router 7 guide
 */

import { $ } from 'zx';
import { promises as fs } from 'fs';
import { printStep, printSuccess, printInstall, printNextSteps } from '../utils/console.mjs';
import { updatePackageJsonScripts, updatePackageJsonPrisma } from '../utils/package-manager.mjs';

/**
 * Integrate Prisma ORM following React Router 7 guide
 * @param {boolean} includeRoutes - Whether to include example routes
 * @param {string} databaseType - Database type to use (postgresql, mysql, sqlite, etc.)
 * @returns {Promise<void>}
 */
export async function integratePrisma(includeRoutes = true, databaseType = 'postgresql') {
    console.log(`Integrating Prisma ORM with ${databaseType.toUpperCase()} following React Router 7 guide...`);

    // Step 1: Install Prisma dependencies (exact from tutorial)
    printInstall('Installing Prisma dependencies');
    await $`npm install prisma @prisma/client @prisma/extension-accelerate`;

    // Step 2: Initialize Prisma
    printStep('Initializing Prisma');
    await $`npx prisma init`;

    // Step 3: Create the exact schema from the tutorial
    printStep('Creating Prisma schema');
    await createPrismaSchema(databaseType);
    printSuccess('Prisma schema created');

    // Step 4: Create the Prisma client configuration
    printStep('Creating Prisma client configuration');
    await $`mkdir -p app/lib`;
    await createPrismaClient();
    printSuccess('Prisma client configuration created');

    // Step 5: Create seed file
    printStep('Creating seed file');
    await createPrismaSeed();
    printSuccess('Seed file created');

    // Step 6: Create example routes (optional)
    if (includeRoutes) {
        printStep('Creating example routes');
        await $`mkdir -p app/routes`;
        await createPrismaRoutes();
        printSuccess('Example routes created');
    }

    // Step 7: Update package.json with Prisma scripts
    printStep('Updating package.json scripts');
    await updatePackageJsonScripts({
        "db:generate": "prisma generate",
        "db:push": "prisma db push",
        "db:seed": "tsx prisma/seed.ts"
    });
    
    await updatePackageJsonPrisma({
        seed: "tsx prisma/seed.ts"
    });
    printSuccess('Package.json updated with Prisma scripts');

    // Print next steps
    printNextSteps([
        'Set your DATABASE_URL in .env file',
        'Run: npm run db:push',
        'Run: npm run db:seed',
        'Run: npm run db:generate',
        'Start your dev server'
    ]);
}

/**
 * Create Prisma schema file
 * @param {string} databaseType - Database type to use
 * @returns {Promise<void>}
 */
async function createPrismaSchema(databaseType) {
    // Map database types to Prisma providers
    const providerMap = {
        'postgresql': 'postgresql',
        'mysql': 'mysql',
        'sqlite': 'sqlite',
        'mongodb': 'mongodb',
        'sqlserver': 'sqlserver',
        'cockroachdb': 'cockroachdb'
    };

    const provider = providerMap[databaseType] || 'postgresql';
    
    const schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

model Post {
  id        Int      @id @default(autoincrement())
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
 * @returns {Promise<void>}
 */
async function createPrismaClient() {
    const prismaClient = `import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: ReturnType<typeof prisma> | undefined;
}`;

    await fs.writeFile('app/lib/prisma.ts', prismaClient);
}

/**
 * Create Prisma seed file
 * @returns {Promise<void>}
 */
async function createPrismaSeed() {
    const seedFile = `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  await prisma.post.create({
    data: {
      title: "My first post",
      content: "This is my first post!",
      published: true,
    },
  });

  await prisma.post.create({
    data: {
      title: "My second post",
      content: "This is my second post!",
      published: false,
    },
  });

  console.log("Database has been seeded. 🌱");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });`;

    await fs.writeFile('prisma/seed.ts', seedFile);
}

/**
 * Create example routes for Prisma
 * @returns {Promise<void>}
 */
async function createPrismaRoutes() {
    // Posts index route
    const postsRoute = `import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/posts";
import { Link } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      createdAt: true,
      published: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { posts };
}

export default function Posts({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>Posts</h1>
      <Link to="/posts/new">Create New Post</Link>
      <ul>
        {loaderData.posts.map((post) => (
          <li key={post.id}>
            <Link to={\`/posts/\${post.id}\`}>
              {post.title} - {post.published ? "Published" : "Draft"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}`;

    await fs.writeFile('app/routes/posts.tsx', postsRoute);

    // Single post route
    const postRoute = `import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/posts.$postId";
import { Link } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  const postId = parseInt(params.postId);
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }

  return { post };
}

export default function Post({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <Link to="/posts">← Back to Posts</Link>
      <h1>{loaderData.post.title}</h1>
      <p>Status: {loaderData.post.published ? "Published" : "Draft"}</p>
      <p>Created: {new Date(loaderData.post.createdAt).toLocaleDateString()}</p>
      {loaderData.post.content && <div>{loaderData.post.content}</div>}
    </div>
  );
}`;

    await fs.writeFile('app/routes/posts.$postId.tsx', postRoute);

    // New post route
    const newPostRoute = `import { prisma } from "~/lib/prisma";
import type { Route } from "./+types/posts.new";
import { Form, redirect, Link } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const published = formData.get("published") === "on";

  await prisma.post.create({
    data: {
      title,
      content,
      published,
    },
  });

  return redirect("/posts");
}

export default function NewPost() {
  return (
    <div>
      <Link to="/posts">← Back to Posts</Link>
      <h1>Create New Post</h1>
      <Form method="post">
        <div>
          <label htmlFor="title">Title:</label>
          <input type="text" id="title" name="title" required />
        </div>
        <div>
          <label htmlFor="content">Content:</label>
          <textarea id="content" name="content"></textarea>
        </div>
        <div>
          <label htmlFor="published">
            <input type="checkbox" id="published" name="published" />
            Published
          </label>
        </div>
        <button type="submit">Create Post</button>
      </Form>
    </div>
  );
}`;

    await fs.writeFile('app/routes/posts.new.tsx', newPostRoute);
}