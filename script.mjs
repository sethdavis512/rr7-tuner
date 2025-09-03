#!/usr/bin/env zx

import inquirer from 'inquirer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { z } from 'zod';
import { promises as fs } from 'fs';

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
    .option('orm', {
        alias: 'db',
        type: 'string',
        description: 'Database type to integrate',
        choices: ['prisma', 'drizzle']
    })
    .option('auth', {
        type: 'string',
        description: 'Authentication method to integrate',
        choices: ['better-auth']
    })
    .help()
    .version('0.0.1').argv;

// ========== Validation Schemas ==========
const PackageJsonSchema = z.object({
    scripts: z.record(z.string()).optional().default({}),
    dependencies: z.record(z.string()).optional(),
    devDependencies: z.record(z.string()).optional(),
    prisma: z.object({
        seed: z.string().optional()
    }).optional()
});

const CliArgsSchema = z.object({
    orm: z.enum(['prisma', 'drizzle']).optional(),
    auth: z.enum(['better-auth']).optional(),
    _: z.array(z.unknown()).optional(),
    $0: z.string().optional()
}).passthrough(); // Allow additional yargs properties

const InquirerAnswersSchema = z.object({
    database: z.enum(['prisma', 'drizzle', 'none']),
    auth: z.enum(['better-auth', 'none'])
});

// ========== Validation Utilities ==========
function validatePackageJson(data) {
    try {
        return PackageJsonSchema.parse(data);
    } catch (error) {
        console.error('❌ Invalid package.json structure:', error.message);
        throw new Error('Failed to parse package.json. Please ensure it has valid JSON structure.');
    }
}

function validateCliArgs(args) {
    try {
        return CliArgsSchema.parse(args);
    } catch (error) {
        console.error('❌ Invalid CLI arguments:', error.message);
        throw new Error('Invalid CLI arguments provided.');
    }
}

function validateInquirerAnswers(answers) {
    try {
        return InquirerAnswersSchema.parse(answers);
    } catch (error) {
        console.error('❌ Invalid interactive answers:', error.message);
        throw new Error('Invalid selections made in interactive mode.');
    }
}

function safeParseJson(jsonString, filename = 'JSON') {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error(`❌ Failed to parse ${filename}:`, error.message);
        throw new Error(`Invalid JSON in ${filename}`);
    }
}


console.log('🎛️  React Router 7 Tuner');
console.log(
    "Welcome! Let's enhance your React Router 7 app with production-ready features.\n"
);

// ========== ORM Integration Functions ==========

async function integratePrisma() {
    console.log('Integrating Prisma ORM following React Router 7 guide...');

    // Step 1: Install Prisma dependencies (exact from tutorial)
    console.log('📦 Installing Prisma dependencies...');
    await $`npm install prisma @prisma/client @prisma/extension-accelerate`;

    // Step 2: Initialize Prisma
    console.log('🏗️  Initializing Prisma...');
    await $`npx prisma init`;

    // Step 3: Create the exact schema from the tutorial
    console.log('📝 Creating Prisma schema...');
    const schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
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
    
    await fs.promises.writeFile('prisma/schema.prisma', schema);
    console.log('✅ Prisma schema created');

    // Step 4: Create the Prisma client configuration
    console.log('📝 Creating Prisma client configuration...');
    await $`mkdir -p app/lib`;
    
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

    await fs.promises.writeFile('app/lib/prisma.ts', prismaClient);
    console.log('✅ Prisma client configuration created');

    // Step 5: Create seed file
    console.log('📝 Creating seed file...');
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

    await fs.promises.writeFile('prisma/seed.ts', seedFile);
    console.log('✅ Seed file created');

    // Step 6: Create example routes
    console.log('📝 Creating example routes...');
    await $`mkdir -p app/routes`;

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

    await fs.promises.writeFile('app/routes/posts.tsx', postsRoute);

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

    await fs.promises.writeFile('app/routes/posts.$postId.tsx', postRoute);

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
          <textarea id="content" name="content" rows={5} />
        </div>
        <div>
          <label>
            <input type="checkbox" name="published" />
            Published
          </label>
        </div>
        <button type="submit">Create Post</button>
      </Form>
    </div>
  );
}`;

    await fs.promises.writeFile('app/routes/posts.new.tsx', newPostRoute);
    console.log('✅ Example routes created');

    // Step 7: Update package.json with Prisma scripts
    console.log('📝 Updating package.json scripts...');
    const packageJsonRaw = await fs.promises.readFile('package.json', 'utf8');
    const packageJsonData = safeParseJson(packageJsonRaw, 'package.json');
    const packageJson = validatePackageJson(packageJsonData);
    packageJson.scripts = {
        ...packageJson.scripts,
        "db:generate": "prisma generate",
        "db:push": "prisma db push",
        "db:migrate": "prisma migrate dev",
        "db:seed": "tsx prisma/seed.ts",
        "db:studio": "prisma studio"
    };
    packageJson.prisma = {
        seed: "tsx prisma/seed.ts"
    };
    await fs.promises.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated with Prisma scripts');

    console.log('🎉 Prisma integration complete following React Router 7 tutorial!');
    console.log('\nNext steps:');
    console.log('1. Set your DATABASE_URL in .env file');
    console.log('2. Run: npm run db:push');
    console.log('3. Run: npm run db:seed');
    console.log('4. Run: npm run db:generate');
    console.log('5. Start your dev server');
}

async function integrateDrizzle() {
    console.log('Integrating Drizzle ORM following React Router 7 patterns...');

    // Step 1: Install Drizzle dependencies
    console.log('📦 Installing Drizzle dependencies...');
    await $`npm install drizzle-orm drizzle-kit @libsql/client dotenv tsx`;

    // Step 2: Create Drizzle config
    console.log('📝 Creating Drizzle configuration...');
    const drizzleConfig = `import type { Config } from 'drizzle-kit';

export default {
  schema: './app/db/schema.ts',
  out: './app/db/migrations',
  driver: 'libsql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
} satisfies Config;`;

    await fs.promises.writeFile('drizzle.config.ts', drizzleConfig);
    console.log('✅ Drizzle config created');

    // Step 3: Create database schema with Post model (matching Prisma structure)
    console.log('📝 Creating Drizzle schema...');
    await $`mkdir -p app/db`;
    
    const schema = `import { sqliteTable, integer, text, int } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  published: int('published', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql\`CURRENT_TIMESTAMP\`),
  updatedAt: text('updated_at').notNull().default(sql\`CURRENT_TIMESTAMP\`),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;`;
    
    await fs.promises.writeFile('app/db/schema.ts', schema);
    console.log('✅ Drizzle schema created');

    // Step 4: Create database connection
    console.log('📝 Creating database connection...');
    const dbConnection = `import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

export const db = drizzle(client, { schema });`;

    await fs.promises.writeFile('app/db/index.ts', dbConnection);
    console.log('✅ Database connection created');

    // Step 5: Create seed file
    console.log('📝 Creating seed file...');
    await $`mkdir -p scripts`;
    
    const seedFile = `import { db } from '../app/db';
import { posts } from '../app/db/schema';

async function seed() {
  await db.insert(posts).values([
    {
      title: "My first post",
      content: "This is my first post!",
      published: true,
    },
    {
      title: "My second post", 
      content: "This is my second post!",
      published: false,
    }
  ]);

  console.log("Database has been seeded. 🌱");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });`;

    await fs.promises.writeFile('scripts/seed.ts', seedFile);
    console.log('✅ Seed file created');

    // Step 6: Create example routes (matching Prisma structure)
    console.log('📝 Creating example routes...');
    await $`mkdir -p app/routes`;

    // Posts index route
    const postsRoute = `import { db } from "~/db";
import { posts } from "~/db/schema";
import { desc } from "drizzle-orm";
import type { Route } from "./+types/posts";
import { Link } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const allPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      createdAt: posts.createdAt,
      published: posts.published,
    })
    .from(posts)
    .orderBy(desc(posts.createdAt));

  return { posts: allPosts };
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

    await fs.promises.writeFile('app/routes/posts.tsx', postsRoute);

    // Single post route
    const postRoute = `import { db } from "~/db";
import { posts } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/posts.$postId";
import { Link } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  const postId = parseInt(params.postId);
  const post = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .get();

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

    await fs.promises.writeFile('app/routes/posts.$postId.tsx', postRoute);

    // New post route
    const newPostRoute = `import { db } from "~/db";
import { posts } from "~/db/schema";
import type { Route } from "./+types/posts.new";
import { Form, redirect, Link } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const published = formData.get("published") === "on";

  await db.insert(posts).values({
    title,
    content,
    published,
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
          <textarea id="content" name="content" rows={5} />
        </div>
        <div>
          <label>
            <input type="checkbox" name="published" />
            Published
          </label>
        </div>
        <button type="submit">Create Post</button>
      </Form>
    </div>
  );
}`;

    await fs.promises.writeFile('app/routes/posts.new.tsx', newPostRoute);
    console.log('✅ Example routes created');

    // Step 7: Update package.json with Drizzle scripts
    console.log('📝 Updating package.json scripts...');
    const packageJsonRaw = await fs.promises.readFile('package.json', 'utf8');
    const packageJsonData = safeParseJson(packageJsonRaw, 'package.json');
    const packageJson = validatePackageJson(packageJsonData);
    packageJson.scripts = {
        ...packageJson.scripts,
        "db:generate": "drizzle-kit generate",
        "db:push": "drizzle-kit push",
        "db:migrate": "drizzle-kit migrate",
        "db:seed": "tsx scripts/seed.ts",
        "db:studio": "drizzle-kit studio"
    };
    await fs.promises.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated with Drizzle scripts');

    // Step 8: Create .env template
    console.log('📝 Creating .env template...');
    const envTemplate = `# Database
DATABASE_URL="file:./dev.db"
# For production with Turso:
# DATABASE_URL="libsql://[your-database-url]"
# DATABASE_AUTH_TOKEN="[your-auth-token]"`;

    await fs.promises.writeFile('.env.example', envTemplate);
    console.log('✅ .env template created');

    console.log('🎉 Drizzle integration complete following React Router 7 patterns!');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and set your DATABASE_URL');
    console.log('2. Run: npm run db:push');
    console.log('3. Run: npm run db:seed');
    console.log('4. Start your dev server');
    console.log('\nFor production with Turso:');
    console.log('- Sign up at https://turso.tech/');
    console.log('- Create a database and get your URL + auth token');
    console.log('- Update your .env with the production credentials');
}

// ========== Authentication Integration Functions ==========

async function integrateBetterAuthWithPrisma() {
    console.log('Integrating Better Auth with Prisma adapter...');

    // Step 1: Install Better Auth dependencies with Prisma adapter
    console.log('📦 Installing Better Auth dependencies...');
    await $`npm install better-auth`;

    // Step 2: Update Prisma schema to include auth tables
    console.log('📝 Adding Better Auth tables to Prisma schema...');
    
    // Read existing schema
    let existingSchema;
    try {
        existingSchema = await fs.promises.readFile('prisma/schema.prisma', 'utf8');
    } catch (error) {
        console.log('⚠️  No existing Prisma schema found. Please run Prisma integration first.');
        return;
    }

    // Add Better Auth models to schema
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
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}`;

    const updatedSchema = existingSchema + authModels;
    await fs.promises.writeFile('prisma/schema.prisma', updatedSchema);
    console.log('✅ Prisma schema updated with Better Auth models');

    // Step 3: Create server-side auth configuration with Prisma adapter
    console.log('📝 Creating server-side auth configuration...');
    await $`mkdir -p app/lib`;
    
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
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiry is updated)
    },
    // Optional: Add more providers
    // socialProviders: {
    //     github: {
    //         clientId: process.env.GITHUB_CLIENT_ID!,
    //         clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    //     },
    // },
});

export type Session = typeof auth.$Infer.Session;`;

    await fs.promises.writeFile('app/lib/auth.server.ts', authServer);
    console.log('✅ Server auth configuration created with Prisma adapter');

    await createSharedAuthFiles();

    // Step 4: Update package.json scripts
    console.log('📝 Updating package.json scripts...');
    const packageJsonRaw = await fs.promises.readFile('package.json', 'utf8');
    const packageJsonData = safeParseJson(packageJsonRaw, 'package.json');
    const packageJson = validatePackageJson(packageJsonData);
    packageJson.scripts = {
        ...packageJson.scripts,
        "auth:generate": "better-auth generate",
        "auth:migrate": "prisma migrate dev",
    };
    await fs.promises.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated');

    await updateEnvTemplate();

    console.log('🎉 Better Auth with Prisma adapter integration complete!');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and set BETTER_AUTH_SECRET');
    console.log('2. Run: npm run auth:generate');
    console.log('3. Run: npm run auth:migrate');
    console.log('4. Visit /signup to create an account');
    console.log('\nGenerated routes:');
    console.log('- /api/auth/* - Auth API endpoints');
    console.log('- /signup, /signin, /dashboard - Auth pages');
}

async function integrateBetterAuthWithDrizzle() {
    console.log('Integrating Better Auth with Drizzle adapter...');

    // Step 1: Install Better Auth dependencies
    console.log('📦 Installing Better Auth dependencies...');
    await $`npm install better-auth`;

    // Step 2: Add Better Auth tables to Drizzle schema
    console.log('📝 Adding Better Auth tables to Drizzle schema...');
    
    // Read existing schema
    let existingSchema;
    try {
        existingSchema = await fs.promises.readFile('app/db/schema.ts', 'utf8');
    } catch (error) {
        console.log('⚠️  No existing Drizzle schema found. Please run Drizzle integration first.');
        return;
    }

    // Add Better Auth models to schema
    const authModels = `

// Better Auth Tables
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: int('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: text('created_at').notNull().default(sql\`CURRENT_TIMESTAMP\`),
  updatedAt: text('updated_at').notNull().default(sql\`CURRENT_TIMESTAMP\`),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
  createdAt: text('created_at').notNull().default(sql\`CURRENT_TIMESTAMP\`),
  updatedAt: text('updated_at').notNull().default(sql\`CURRENT_TIMESTAMP\`),
}, (table) => ({
  providerProviderAccountIdIndex: unique().on(table.provider, table.providerAccountId),
}));

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: text('expires').notNull(),
  createdAt: text('created_at').notNull().default(sql\`CURRENT_TIMESTAMP\`),
  updatedAt: text('updated_at').notNull().default(sql\`CURRENT_TIMESTAMP\`),
});

export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: text('expires').notNull(),
}, (table) => ({
  identifierTokenIndex: unique().on(table.identifier, table.token),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;`;

    // Update imports at the top
    const updatedSchema = existingSchema.replace(
        `import { sqliteTable, integer, text, int } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';`,
        `import { sqliteTable, integer, text, int, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';`
    ) + authModels;

    await fs.promises.writeFile('app/db/schema.ts', updatedSchema);
    console.log('✅ Drizzle schema updated with Better Auth tables');

    // Step 3: Create server-side auth configuration with Drizzle adapter
    console.log('📝 Creating server-side auth configuration...');
    await $`mkdir -p app/lib`;
    
    const authServer = `import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db";
import * as schema from "~/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
            ...schema,
            user: schema.users,
            account: schema.accounts,
            session: schema.sessions,
            verificationToken: schema.verificationTokens,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    // Optional: Add more providers
    // socialProviders: {
    //     github: {
    //         clientId: process.env.GITHUB_CLIENT_ID!,
    //         clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    //     },
    // },
});

export type Session = typeof auth.$Infer.Session;`;

    await fs.promises.writeFile('app/lib/auth.server.ts', authServer);
    console.log('✅ Server auth configuration created with Drizzle adapter');

    await createSharedAuthFiles();

    // Step 4: Update package.json scripts
    console.log('📝 Updating package.json scripts...');
    const packageJsonRaw = await fs.promises.readFile('package.json', 'utf8');
    const packageJsonData = safeParseJson(packageJsonRaw, 'package.json');
    const packageJson = validatePackageJson(packageJsonData);
    packageJson.scripts = {
        ...packageJson.scripts,
        "auth:generate": "better-auth generate",
        "auth:migrate": "drizzle-kit generate && drizzle-kit migrate",
    };
    await fs.promises.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated');

    await updateEnvTemplate();

    console.log('🎉 Better Auth with Drizzle adapter integration complete!');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and set BETTER_AUTH_SECRET');
    console.log('2. Run: npm run auth:generate');
    console.log('3. Run: npm run auth:migrate');
    console.log('4. Visit /signup to create an account');
    console.log('\nGenerated routes:');
    console.log('- /api/auth/* - Auth API endpoints');
    console.log('- /signup, /signin, /dashboard - Auth pages');
}

// Shared helper functions for Better Auth
async function createSharedAuthFiles() {
    // Step 1: Create API route handler  
    console.log('📝 Creating API route handler...');
    await $`mkdir -p app/routes`;
    
    const apiRoute = `import { auth } from '~/lib/auth.server';
import type { Route } from './+types/api.auth.$';

export async function loader({ request }: Route.LoaderArgs) {
    return auth.handler(request);
}

export async function action({ request }: Route.ActionArgs) {
    return auth.handler(request);
}`;

    await fs.promises.writeFile('app/routes/api.auth.$.ts', apiRoute);
    console.log('✅ API route handler created');

    // Step 2: Create client-side auth
    console.log('📝 Creating client auth configuration...');
    
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

    await fs.promises.writeFile('app/lib/auth-client.ts', authClient);
    console.log('✅ Client auth configuration created');

    // Step 3: Create authentication pages
    console.log('📝 Creating authentication pages...');
    
    const signupPage = `import { Form, Link } from "react-router";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";
import type { Route } from "./+types/signup";

export default function SignUp() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await authClient.signUp.email({
                email,
                password,
                name,
            }, {
                onSuccess: () => {
                    window.location.href = "/dashboard";
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
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
            <Form onSubmit={handleSignUp}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>
            </Form>
            <div className="mt-4 text-center">
                <Link to="/signin" className="text-blue-500 hover:text-blue-700">
                    Already have an account? Sign in
                </Link>
            </div>
        </div>
    );
}`;

    await fs.promises.writeFile('app/routes/signup.tsx', signupPage);

    const signinPage = `import { Form, Link } from "react-router";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";
import type { Route } from "./+types/signin";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await authClient.signIn.email({
                email,
                password,
            }, {
                onSuccess: () => {
                    window.location.href = "/dashboard";
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
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
            <Form onSubmit={handleSignIn}>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    {loading ? "Signing In..." : "Sign In"}
                </button>
            </Form>
            <div className="mt-4 text-center">
                <Link to="/signup" className="text-blue-500 hover:text-blue-700">
                    Don't have an account? Sign up
                </Link>
            </div>
        </div>
    );
}`;

    await fs.promises.writeFile('app/routes/signin.tsx', signinPage);

    const dashboardPage = `import { Link } from "react-router";
import { useSession, signOut } from "~/lib/auth-client";

export default function Dashboard() {
    const { data: session, isPending } = useSession();

    if (isPending) {
        return <div className="p-8">Loading...</div>;
    }

    if (!session) {
        return (
            <div className="p-8">
                <p>You must be signed in to view this page.</p>
                <Link to="/signin" className="text-blue-500 hover:text-blue-700">
                    Sign in
                </Link>
            </div>
        );
    }

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/";
                }
            }
        });
    };

    return (
        <div className="p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
                    <p className="text-gray-600 mb-4">
                        You're signed in as: <strong>{session.user.email}</strong>
                    </p>
                    {session.user.name && (
                        <p className="text-gray-600 mb-4">
                            Name: <strong>{session.user.name}</strong>
                        </p>
                    )}
                    <button
                        onClick={handleSignOut}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Sign Out
                    </button>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Protected Content</h3>
                    <p>This content is only visible to authenticated users.</p>
                    <Link to="/posts" className="text-blue-500 hover:text-blue-700 mt-2 inline-block">
                        View Posts →
                    </Link>
                </div>
            </div>
        </div>
    );
}`;

    await fs.promises.writeFile('app/routes/dashboard.tsx', dashboardPage);
    console.log('✅ Authentication pages created');
}

async function updateEnvTemplate() {
    console.log('📝 Updating .env template with auth variables...');
    let envTemplate;
    try {
        envTemplate = await fs.promises.readFile('.env.example', 'utf8');
    } catch {
        envTemplate = '';
    }
    
    const authEnvVars = `
# Better Auth
BETTER_AUTH_SECRET="your-32-character-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Social providers
# GITHUB_CLIENT_ID="your-github-client-id"
# GITHUB_CLIENT_SECRET="your-github-client-secret"
`;

    await fs.promises.writeFile('.env.example', envTemplate + authEnvVars);
    console.log('✅ .env template updated with auth variables');
}

async function integrateBetterAuth() {
    console.log('Integrating Better Auth standalone (no database detected)...');

    // Step 1: Install Better Auth dependencies
    console.log('📦 Installing Better Auth dependencies...');
    await $`npm install better-auth`;

    // Step 2: Create server-side auth configuration
    console.log('📝 Creating server-side auth configuration...');
    await $`mkdir -p app/lib`;
    
    const authServer = `import { betterAuth } from "better-auth";

export const auth = betterAuth({
    database: {
        provider: "postgres", // Use "sqlite" for Drizzle setups
        url: process.env.DATABASE_URL!,
    },
    emailAndPassword: {
        enabled: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiry is updated)
    },
    // Optional: Add more providers
    // socialProviders: {
    //     github: {
    //         clientId: process.env.GITHUB_CLIENT_ID!,
    //         clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    //     },
    // },
});

export type Session = typeof auth.$Infer.Session;`;

    await fs.promises.writeFile('app/lib/auth.server.ts', authServer);
    console.log('✅ Server auth configuration created');

    await createSharedAuthFiles();
    await updateEnvTemplate();

    console.log('🎉 Better Auth standalone integration complete!');
    console.log('\nNext steps:');
    console.log('1. Copy .env.example to .env and set DATABASE_URL and BETTER_AUTH_SECRET');
    console.log('2. Set up your database (PostgreSQL recommended)');
    console.log('3. Visit /signup to create an account');
    console.log('\nGenerated routes:');
    console.log('- /api/auth/* - Auth API endpoints');
    console.log('- /signup, /signin, /dashboard - Auth pages');
}

// ==========

async function main() {
    // Check if package.json exists (basic sanity check)
    try {
        await fs.readFile('package.json', 'utf8');
    } catch (error) {
        console.error('❌ No package.json found in current directory.');
        console.error('💡 Please run this script from the root of your React Router 7 project.');
        process.exit(1);
    }
    
    // Validate CLI arguments
    const validatedArgs = validateCliArgs(argv);
    
    // Check if any CLI arguments were provided
    const hasArgs = validatedArgs.orm || validatedArgs.auth;
    
    if (hasArgs) {
        // CLI mode - execute directly
        if (validatedArgs.orm === 'prisma') {
            await integratePrisma();
        } else if (validatedArgs.orm === 'drizzle') {
            await integrateDrizzle();
        }

        if (validatedArgs.auth === 'better-auth') {
            // Determine which Better Auth integration based on database choice
            if (validatedArgs.orm === 'prisma') {
                await integrateBetterAuthWithPrisma();
            } else if (validatedArgs.orm === 'drizzle') {
                await integrateBetterAuthWithDrizzle();
            } else {
                await integrateBetterAuth();
            }
        }
    } else {
        // Interactive mode - use inquirer
        console.log('No arguments provided. Starting interactive mode...\n');
        
        const rawAnswers = await inquirer.prompt([
            {
                type: 'list',
                name: 'database',
                message: 'Which database integration would you like to add?',
                choices: [
                    {
                        name: '🗄️  Prisma ORM (PostgreSQL)',
                        value: 'prisma',
                        short: 'Prisma'
                    },
                    {
                        name: '🗃️  Drizzle ORM (SQLite/LibSQL)', 
                        value: 'drizzle',
                        short: 'Drizzle'
                    },
                    {
                        name: '❌  Skip database setup',
                        value: 'none',
                        short: 'None'
                    }
                ]
            },
            {
                type: 'list',
                name: 'auth',
                message: 'Which authentication integration would you like to add?',
                choices: [
                    {
                        name: '🔐  Better Auth',
                        value: 'better-auth',
                        short: 'Better Auth'
                    },
                    {
                        name: '❌  Skip authentication setup',
                        value: 'none',
                        short: 'None'
                    }
                ]
            }
        ]);

        // Validate interactive answers
        const answers = validateInquirerAnswers(rawAnswers);

        // Execute selected features
        if (answers.database === 'prisma') {
            await integratePrisma();
            if (answers.auth !== 'none') {
                console.log('\n' + '='.repeat(50) + '\n');
            }
        }
        
        if (answers.database === 'drizzle') {
            await integrateDrizzle();
            if (answers.auth !== 'none') {
                console.log('\n' + '='.repeat(50) + '\n');
            }
        }
        
        if (answers.auth === 'better-auth') {
            // Determine which Better Auth integration based on database choice
            if (answers.database === 'prisma') {
                await integrateBetterAuthWithPrisma();
            } else if (answers.database === 'drizzle') {
                await integrateBetterAuthWithDrizzle();
            } else {
                await integrateBetterAuth();
            }
        }

        // Show completion message if any features were selected
        const selectedFeatures = [];
        if (answers.database !== 'none') selectedFeatures.push(answers.database);
        if (answers.auth !== 'none') selectedFeatures.push(answers.auth);
        
        if (selectedFeatures.length > 0) {
            console.log('\n🎉 All selected features have been integrated!');
            console.log('Check the output above for next steps for each feature.');
        } else {
            console.log('\n👋 No features selected. Exiting...');
        }
    }
}

// Add error handling wrapper
main().catch((error) => {
    console.error('❌ Script execution failed:', error.message);
    console.error('\n🔍 Debug information:');
    console.error(error.stack);
    console.error('\n💡 Common fixes:');
    console.error('- Ensure you are running this in a React Router 7 project directory');
    console.error('- Check that you have write permissions in this directory');
    console.error('- Verify your Node.js version is 18+ and npm is installed');
    console.error('- Make sure your package.json exists and is valid JSON');
    process.exit(1);
});