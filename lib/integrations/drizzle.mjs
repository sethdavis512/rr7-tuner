#!/usr/bin/env zx

/**
 * @fileoverview Drizzle integration module
 * @description Complete Drizzle setup following React Router 7 patterns
 */

import { $ } from 'zx';
import { promises as fs } from 'fs';
import { printStep, printSuccess, printInstall, printNextSteps } from '../utils/console.mjs';
import { updatePackageJsonScripts } from '../utils/package-manager.mjs';

/**
 * Integrate Drizzle ORM following React Router 7 patterns
 * @param {boolean} includeRoutes - Whether to include example routes
 * @param {string} databaseType - Database type to use (postgres, mysql, sqlite, etc.)
 * @returns {Promise<void>}
 */
export async function integrateDrizzle(includeRoutes = true, databaseType = 'turso') {
    console.log(`Integrating Drizzle ORM with ${databaseType.toUpperCase()} following React Router 7 patterns...`);

    // Step 1: Install Drizzle dependencies
    printInstall('Installing Drizzle dependencies');
    await $`npm install drizzle-orm drizzle-kit @libsql/client dotenv tsx`;

    // Step 2: Create Drizzle config
    printStep('Creating Drizzle configuration');
    await createDrizzleConfig(databaseType);
    printSuccess('Drizzle config created');

    // Step 3: Create database schema with Post model (matching Prisma structure)
    printStep('Creating Drizzle schema');
    await $`mkdir -p app/db`;
    await createDrizzleSchema(databaseType);
    printSuccess('Drizzle schema created');

    // Step 4: Create database connection
    printStep('Creating database connection');
    await createDrizzleConnection(databaseType);
    printSuccess('Database connection created');

    // Step 5: Create seed file
    printStep('Creating seed file');
    await $`mkdir -p scripts`;
    await createDrizzleSeed();
    printSuccess('Seed file created');

    // Step 6: Create example routes (optional)
    if (includeRoutes) {
        printStep('Creating example routes');
        await $`mkdir -p app/routes`;
        await createDrizzleRoutes();
        printSuccess('Example routes created');
    }

    // Step 7: Update package.json with Drizzle scripts
    printStep('Updating package.json scripts');
    await updatePackageJsonScripts({
        "db:generate": "drizzle-kit generate",
        "db:push": "drizzle-kit push",
        "db:migrate": "drizzle-kit migrate",
        "db:seed": "tsx scripts/seed.ts",
        "db:studio": "drizzle-kit studio"
    });
    printSuccess('Package.json updated with Drizzle scripts');

    // Step 8: Create .env template
    printStep('Creating .env template');
    await createEnvTemplate();
    printSuccess('.env template created');

    // Print next steps
    printNextSteps([
        'Copy .env.example to .env and set your DATABASE_URL',
        'Run: npm run db:push',
        'Run: npm run db:seed',
        'Start your dev server'
    ]);
}

/**
 * Create Drizzle configuration file
 * @param {string} databaseType - Database type to use
 * @returns {Promise<void>}
 */
async function createDrizzleConfig(databaseType) {
    // Map database types to Drizzle dialects and drivers
    const configMap = {
        'postgres': { dialect: 'postgresql', driver: 'node-postgres' },
        'neon': { dialect: 'postgresql', driver: 'neon-http' },
        'vercel-postgres': { dialect: 'postgresql', driver: 'vercel-postgres' },
        'supabase': { dialect: 'postgresql', driver: 'node-postgres' },
        'mysql': { dialect: 'mysql', driver: 'mysql2' },
        'planetscale': { dialect: 'mysql', driver: 'planetscale' },
        'sqlite': { dialect: 'sqlite', driver: 'better-sqlite3' },
        'turso': { dialect: 'sqlite', driver: 'turso' },
        'd1': { dialect: 'sqlite', driver: 'd1' }
    };

    const config = configMap[databaseType] || configMap['turso'];
    
    let credentialsConfig = '';
    if (config.dialect === 'sqlite') {
        if (databaseType === 'turso' || databaseType === 'd1') {
            credentialsConfig = `    dbCredentials: {
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_AUTH_TOKEN,
    },`;
        } else {
            credentialsConfig = `    dbCredentials: {
        url: process.env.DATABASE_URL || 'file:./dev.db',
    },`;
        }
    } else {
        credentialsConfig = `    dbCredentials: {
        connectionString: process.env.DATABASE_URL!,
    },`;
    }

    const drizzleConfig = `import type { Config } from 'drizzle-kit';

export default {
    schema: './app/db/schema.ts',
    out: './drizzle',
    dialect: '${config.dialect}',
    driver: '${config.driver}',
${credentialsConfig}
} satisfies Config;`;

    await fs.writeFile('drizzle.config.ts', drizzleConfig);
}

/**
 * Create Drizzle schema file
 * @param {string} databaseType - Database type to use
 * @returns {Promise<void>}
 */
async function createDrizzleSchema(databaseType) {
    // Determine the database dialect for schema generation
    const dialectMap = {
        'postgres': 'postgresql',
        'neon': 'postgresql',
        'vercel-postgres': 'postgresql',
        'supabase': 'postgresql',
        'mysql': 'mysql',
        'planetscale': 'mysql',
        'sqlite': 'sqlite',
        'turso': 'sqlite',
        'd1': 'sqlite'
    };

    const dialect = dialectMap[databaseType] || 'sqlite';
    
    let schema = '';
    
    if (dialect === 'postgresql') {
        schema = `import { pgTable, serial, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;`;
    } else if (dialect === 'mysql') {
        schema = `import { mysqlTable, int, varchar, text, boolean, timestamp } from 'drizzle-orm/mysql-core';

export const posts = mysqlTable('posts', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;`;
    } else {
        // SQLite (default)
        schema = `import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  published: integer('published', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql\`(unixepoch())\`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql\`(unixepoch())\`).notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;`;
    }
    
    await fs.writeFile('app/db/schema.ts', schema);
}

/**
 * Create Drizzle database connection
 * @param {string} databaseType - Database type to use
 * @returns {Promise<void>}
 */
async function createDrizzleConnection(databaseType) {
    // Determine the database dialect for connection setup
    const dialectMap = {
        'postgres': 'postgresql',
        'neon': 'postgresql',
        'vercel-postgres': 'postgresql', 
        'supabase': 'postgresql',
        'mysql': 'mysql',
        'planetscale': 'mysql',
        'sqlite': 'sqlite',
        'turso': 'sqlite',
        'd1': 'sqlite'
    };

    const dialect = dialectMap[databaseType] || 'sqlite';
    
    let dbConnection = '';
    
    if (dialect === 'postgresql') {
        if (databaseType === 'neon') {
            dbConnection = `import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });`;
        } else if (databaseType === 'vercel-postgres') {
            dbConnection = `import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });`;
        } else {
            // Regular PostgreSQL
            dbConnection = `import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, { schema });`;
        }
    } else if (dialect === 'mysql') {
        if (databaseType === 'planetscale') {
            dbConnection = `import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { Client } from '@planetscale/database';
import * as schema from './schema';

const client = new Client({
  url: process.env.DATABASE_URL!,
});

export const db = drizzle(client, { schema });`;
        } else {
            // Regular MySQL
            dbConnection = `import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL!,
});

export const db = drizzle(poolConnection, { schema });`;
        }
    } else {
        // SQLite variants
        if (databaseType === 'turso') {
            dbConnection = `import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });`;
        } else if (databaseType === 'd1') {
            dbConnection = `import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// In Cloudflare Workers, the D1 database is available as a binding
export const db = drizzle(env.DB, { schema });`;
        } else {
            // Regular SQLite
            dbConnection = `import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database(process.env.DATABASE_URL || 'dev.db');
export const db = drizzle(sqlite, { schema });`;
        }
    }

    await fs.writeFile('app/db/index.ts', dbConnection);
}

/**
 * Create Drizzle seed file
 * @returns {Promise<void>}
 */
async function createDrizzleSeed() {
    const seedFile = `import { db } from '../app/db';
import { posts } from '../app/db/schema';

async function seed() {
  console.log('Seeding database...');

  await db.insert(posts).values([
    {
      title: 'My first post',
      content: 'This is my first post!',
      published: true,
    },
    {
      title: 'My second post', 
      content: 'This is my second post!',
      published: false,
    },
  ]);

  console.log('Database has been seeded. 🌱');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });`;

    await fs.writeFile('scripts/seed.ts', seedFile);
}

/**
 * Create example routes for Drizzle
 * @returns {Promise<void>}
 */
async function createDrizzleRoutes() {
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

    await fs.writeFile('app/routes/posts.tsx', postsRoute);

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

    await fs.writeFile('app/routes/posts.$postId.tsx', postRoute);

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

/**
 * Create .env template file
 * @returns {Promise<void>}
 */
async function createEnvTemplate() {
    const envTemplate = `# Database
DATABASE_URL="file:./dev.db"
# For production with Turso:
# DATABASE_URL="libsql://[your-database-name]-[your-github-username].turso.io"
# DATABASE_AUTH_TOKEN="[your-auth-token]"`;

    await fs.writeFile('.env.example', envTemplate);
}