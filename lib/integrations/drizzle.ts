/**
 * @fileoverview Drizzle integration module
 * @description Complete Drizzle setup following React Router 7 patterns
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
import {
    fileExists,
    readJsonFile,
    updateRoutesFile
} from '../utils/file-operations.ts';

/**
 * Integrate Drizzle ORM following official documentation
 */
export async function integrateDrizzle(
    includeRoutes: boolean = true,
    databaseType: string = 'turso'
): Promise<void> {
    console.log(
        `Integrating Drizzle ORM with ${databaseType.toUpperCase()}...`
    );

    // Check if Drizzle is already set up
    const drizzleConfigExists = await fileExists('drizzle.config.ts');
    const drizzleSchemaExists = await fileExists('lib/db/schema.ts');
    const drizzleClientExists = await fileExists('app/lib/db.ts');

    // Determine required dependencies based on database type
    const dependencies = getDrizzleDependencies(databaseType);
    const depsExist = await dependenciesExist(dependencies);

    // Step 1: Install Drizzle dependencies
    if (depsExist) {
        printWarning(
            'Drizzle dependencies already installed, skipping installation'
        );
    } else {
        printInstall(`Installing Drizzle dependencies for ${databaseType}`);
        const installCmd = `npm install ${dependencies.join(' ')}`;
        await $`${installCmd.split(' ')}`;

        // Install drizzle-kit as dev dependency
        await $`npm install -D drizzle-kit`;
    }

    // Step 2: Create drizzle configuration
    if (drizzleConfigExists) {
        printWarning('Drizzle config already exists, skipping config creation');
    } else {
        printStep('Creating Drizzle configuration');
        await createDrizzleConfig(databaseType);
        printSuccess('Drizzle configuration created');
    }

    // Step 3: Create database schema
    if (drizzleSchemaExists) {
        printWarning('Drizzle schema already exists, skipping schema creation');
    } else {
        printStep('Creating database schema');
        await $`mkdir -p lib/db`;
        await createDrizzleSchema(databaseType);
        printSuccess('Database schema created');
    }

    // Step 4: Create database client
    if (drizzleClientExists) {
        printWarning('Drizzle client already exists, skipping client creation');
    } else {
        printStep('Creating database client');
        await $`mkdir -p app/lib`;
        await createDrizzleClient(databaseType);
        printSuccess('Database client created');
    }

    // Step 5: Create migration utilities
    const migrationExists = await fileExists('lib/db/migrate.ts');
    if (migrationExists) {
        printWarning(
            'Migration utility already exists, skipping migration creation'
        );
    } else {
        printStep('Creating migration utilities');
        await createMigrationUtility(databaseType);
        printSuccess('Migration utilities created');
    }

    // Step 6: Create seed file
    const seedExists = await fileExists('lib/db/seed.ts');
    if (seedExists) {
        printWarning('Seed file already exists, skipping seed creation');
    } else {
        printStep('Creating seed file');
        await createDrizzleSeed(databaseType);
        printSuccess('Seed file created');
    }

    // Step 7: Create example routes (optional)
    if (includeRoutes) {
        const routesExist = await fileExists('app/routes/todos.tsx');
        if (routesExist) {
            printWarning(
                'Example routes already exist, skipping route creation'
            );
        } else {
            printStep('Creating example routes');
            await $`mkdir -p app/routes`;
            await createDrizzleRoutes(databaseType);
            printSuccess('Example routes created');
        }

        // Register routes in routes.ts if it exists
        printStep('Registering routes in routes.ts');
        await updateRoutesFile([
            { path: '/todos', file: 'routes/todos.tsx' },
            { path: '/todos/:todoId', file: 'routes/todos.$todoId.tsx' },
            { path: '/todos/new', file: 'routes/todos.new.tsx' }
        ]);
        printSuccess('Routes registered successfully');
    }

    // Step 8: Update package.json with Drizzle scripts
    const packageJsonData = (await readJsonFile(
        'package.json',
        'package.json'
    )) as Record<string, any>;
    const existingScripts = packageJsonData.scripts || {};
    const drizzleScripts = {
        'db:generate': 'drizzle-kit generate',
        'db:migrate': 'bun lib/db/migrate.ts',
        'db:push': 'drizzle-kit push',
        'db:seed': 'bun lib/db/seed.ts',
        'db:studio': 'drizzle-kit studio'
    };

    const scriptsExist = Object.keys(drizzleScripts).every(
        (script) => script in existingScripts
    );

    if (scriptsExist) {
        printWarning(
            'Drizzle scripts already exist in package.json, skipping script updates'
        );
    } else {
        printStep('Updating package.json scripts');
        await updatePackageJsonScripts(drizzleScripts);
        printSuccess('Package.json updated with Drizzle scripts');
    }

    // Print next steps
    const nextSteps = getNextSteps(databaseType);
    printNextSteps(nextSteps);
}

/**
 * Get required dependencies for the database type
 */
function getDrizzleDependencies(databaseType: string): string[] {
    const baseDeps = ['drizzle-orm', 'drizzle-zod'];

    switch (databaseType.toLowerCase()) {
        case 'postgresql':
        case 'postgres':
            return [...baseDeps, 'pg', '@types/pg'];
        case 'mysql':
            return [...baseDeps, 'mysql2'];
        case 'sqlite':
        case 'turso':
        case 'libsql':
            return [...baseDeps, '@libsql/client'];
        case 'better-sqlite3':
            return [...baseDeps, 'better-sqlite3', '@types/better-sqlite3'];
        default:
            return [...baseDeps, '@libsql/client']; // Default to libsql
    }
}

/**
 * Create drizzle.config.ts file
 */
async function createDrizzleConfig(databaseType: string): Promise<void> {
    let configContent = '';

    if (
        databaseType.toLowerCase() === 'postgresql' ||
        databaseType.toLowerCase() === 'postgres'
    ) {
        configContent = `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});`;
    } else {
        // SQLite/Turso/LibSQL
        configContent = `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});`;
    }

    await fs.writeFile('drizzle.config.ts', configContent);
}

/**
 * Create database schema
 */
async function createDrizzleSchema(databaseType: string): Promise<void> {
    let schemaContent = '';

    if (
        databaseType.toLowerCase() === 'postgresql' ||
        databaseType.toLowerCase() === 'postgres'
    ) {
        schemaContent = `import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const todos = pgTable('todos', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertTodoSchema = createInsertSchema(todos);
export const selectTodoSchema = createSelectSchema(todos);
export type Todo = z.infer<typeof selectTodoSchema>;
export type NewTodo = z.infer<typeof insertTodoSchema>;`;
    } else {
        // SQLite/Turso/LibSQL
        schemaContent = `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Zod schemas for validation
export const insertTodoSchema = createInsertSchema(todos);
export const selectTodoSchema = createSelectSchema(todos);
export type Todo = z.infer<typeof selectTodoSchema>;
export type NewTodo = z.infer<typeof insertTodoSchema>;`;
    }

    await fs.writeFile('lib/db/schema.ts', schemaContent);
}

/**
 * Create database client
 */
async function createDrizzleClient(databaseType: string): Promise<void> {
    let clientContent = '';

    if (
        databaseType.toLowerCase() === 'postgresql' ||
        databaseType.toLowerCase() === 'postgres'
    ) {
        clientContent = `import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../../lib/db/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle({ client: pool, schema });`;
    } else {
        // SQLite/Turso/LibSQL
        clientContent = `import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../../lib/db/schema';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });`;
    }

    await fs.writeFile('app/lib/db.ts', clientContent);
}

/**
 * Create migration utility
 */
async function createMigrationUtility(databaseType: string): Promise<void> {
    let migrateContent = '';

    if (
        databaseType.toLowerCase() === 'postgresql' ||
        databaseType.toLowerCase() === 'postgres'
    ) {
        migrateContent = `import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle({ client: pool });

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migrations completed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});`;
    } else {
        // SQLite/Turso/LibSQL
        migrateContent = `import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client);

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migrations completed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});`;
    }

    await fs.writeFile('lib/db/migrate.ts', migrateContent);
}

/**
 * Create seed file
 */
async function createDrizzleSeed(databaseType: string): Promise<void> {
    let seedContent = '';

    if (
        databaseType.toLowerCase() === 'postgresql' ||
        databaseType.toLowerCase() === 'postgres'
    ) {
        seedContent = `import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { todos } from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle({ client: pool });

async function main() {
  console.log('Seeding database...');

  await db.insert(todos).values([
    {
      title: 'Learn Drizzle ORM',
      description: 'Get familiar with Drizzle ORM and its features',
      completed: false,
    },
    {
      title: 'Build a React Router 7 app',
      description: 'Create an awesome application with React Router 7',
      completed: false,
    },
    {
      title: 'Deploy to production',
      description: 'Deploy the application to a production environment',
      completed: false,
    },
  ]);

  console.log('Database seeded successfully! 🌱');
}

main()
  .catch((e) => {
    console.error('Seeding failed!');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });`;
    } else {
        // SQLite/Turso/LibSQL
        seedContent = `import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { todos } from './schema';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client);

async function main() {
  console.log('Seeding database...');

  await db.insert(todos).values([
    {
      title: 'Learn Drizzle ORM',
      description: 'Get familiar with Drizzle ORM and its features',
      completed: false,
    },
    {
      title: 'Build a React Router 7 app',
      description: 'Create an awesome application with React Router 7',
      completed: false,
    },
    {
      title: 'Deploy to production',
      description: 'Deploy the application to a production environment',
      completed: false,
    },
  ]);

  console.log('Database seeded successfully! 🌱');
}

main()
  .catch((e) => {
    console.error('Seeding failed!');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });`;
    }

    await fs.writeFile('lib/db/seed.ts', seedContent);
}

/**
 * Create example routes for Drizzle
 */
async function createDrizzleRoutes(databaseType: string): Promise<void> {
    // Todos list route
    const todosRoute = `import { db } from '~/lib/db';
import { todos } from '../../lib/db/schema';
import { desc } from 'drizzle-orm';
import type { Route } from './+types/todos';

export async function loader({ request }: Route.LoaderArgs) {
    const todoList = await db.select().from(todos).orderBy(desc(todos.createdAt));
    return { todos: todoList };
}

export default function Todos({ loaderData }: Route.ComponentProps) {
    const { todos: todoList } = loaderData;

    return (
        <div>
            <h1>Todos</h1>
            <a href="/todos/new">Create New Todo</a>
            <ul>
                {todoList.map((todo) => (
                    <li key={todo.id}>
                        <a href={\`/todos/\${todo.id}\`}>
                            {todo.title} {todo.completed ? '✅' : '⏳'}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}`;

    await fs.writeFile('app/routes/todos.tsx', todosRoute);

    // Individual todo route
    const todoRoute = `import { db } from '~/lib/db';
import { todos } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Route } from './+types/todos.$todoId';

export async function loader({ params }: Route.LoaderArgs) {
    const todoId = ${
        databaseType.toLowerCase() === 'postgresql' ||
        databaseType.toLowerCase() === 'postgres'
            ? 'params.todoId'
            : 'parseInt(params.todoId)'
    };
    const todo = await db.select().from(todos).where(eq(todos.id, todoId)).get();

    if (!todo) {
        throw new Response('Not Found', { status: 404 });
    }

    return { todo };
}

export default function Todo({ loaderData }: Route.ComponentProps) {
    const { todo } = loaderData;

    return (
        <div>
            <h1>{todo.title}</h1>
            <p>{todo.description}</p>
            <p>Status: {todo.completed ? 'Completed' : 'Pending'}</p>
            <p>Created: {new Date(todo.createdAt).toLocaleDateString()}</p>
            <a href="/todos">← Back to Todos</a>
        </div>
    );
}`;

    await fs.writeFile('app/routes/todos.$todoId.tsx', todoRoute);

    // New todo route
    const newTodoRoute = `import { redirect } from '@react-router/node';
import { db } from '~/lib/db';
import { todos, insertTodoSchema } from '../../lib/db/schema';
import type { Route } from './+types/todos.new';

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const completed = formData.get('completed') === 'on';

    // Validate input using Zod schema
    const validatedData = insertTodoSchema.parse({
        title,
        description,
        completed,
    });

    await db.insert(todos).values(validatedData);

    return redirect('/todos');
}

export default function NewTodo() {
    return (
        <div>
            <h1>Create New Todo</h1>
            <form method="post">
                <div>
                    <label htmlFor="title">Title:</label>
                    <input type="text" id="title" name="title" required />
                </div>
                <div>
                    <label htmlFor="description">Description:</label>
                    <textarea id="description" name="description"></textarea>
                </div>
                <div>
                    <label>
                        <input type="checkbox" name="completed" />
                        Completed
                    </label>
                </div>
                <button type="submit">Create Todo</button>
            </form>
            <a href="/todos">← Back to Todos</a>
        </div>
    );
}`;

    await fs.writeFile('app/routes/todos.new.tsx', newTodoRoute);
}

/**
 * Get next steps based on database type
 */
function getNextSteps(databaseType: string): string[] {
    const baseSteps = [
        'Run "bun run db:generate" to generate migrations',
        'Run "bun run db:migrate" to apply migrations to your database',
        'Run "bun run db:seed" to seed your database with example data',
        'Run "bun run db:studio" to open Drizzle Studio',
        'Start your development server'
    ];

    if (
        databaseType.toLowerCase() === 'postgresql' ||
        databaseType.toLowerCase() === 'postgres'
    ) {
        return [
            'Set your DATABASE_URL in the .env file (e.g., postgresql://user:password@localhost:5432/database)',
            ...baseSteps
        ];
    } else {
        return [
            'Set your DATABASE_URL in the .env file (e.g., file:local.db for local SQLite or libsql://... for Turso)',
            'Set your DATABASE_AUTH_TOKEN if using Turso',
            ...baseSteps
        ];
    }
}
