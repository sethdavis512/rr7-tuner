# RR7 Tuner

A React Router 7 enhancement tool that helps you add production-ready features to your app following official tutorials.

## Features

- **Prisma Integration**: Complete setup following the [official Prisma React Router 7 guide](https://www.prisma.io/docs/guides/react-router-7)
- **Database Support**: PostgreSQL with Prisma Accelerate extension
- **Example Routes**: Full CRUD operations with Posts model
- **TypeScript Support**: Proper types and configuration

## Usage

The tool supports both **interactive mode** and **command line arguments** for maximum flexibility.

### Interactive Mode

Run without any arguments to start the interactive menu:

```bash
node script.mjs
```

This will prompt you with questions to select your database, authentication, and whether to include example routes. Perfect for first-time setup or when you want to add multiple integrations.

### Command Line Arguments

For automation, CI/CD, or when you know exactly what you want:

#### `--orm` / `--db`

Set up database integration with the specified ORM.

**Options:**

- `prisma` - Complete Prisma setup following React Router 7 tutorial
- `drizzle` - Complete Drizzle setup with React Router 7 patterns

**Example:**

```bash
node script.mjs --orm prisma
node script.mjs --db drizzle
```

#### `--auth`

Set up authentication with the specified provider.

**Options:**

- `better-auth` - Better Auth integration

**Example:**

```bash
node script.mjs --auth better-auth
```

#### `-r, --routes`

Include example routes (Posts CRUD operations for learning/testing).

**Options:**

- `true` (default) - Include example routes
- `false` - Skip example route generation

**Examples:**

```bash
node script.mjs --orm prisma --routes=false
node script.mjs --db drizzle --no-routes
```

### Prisma Integration

When you run `node script.mjs --orm prisma`, the script will:

1. Install required dependencies (`prisma`, `@prisma/client`, `@prisma/extension-accelerate`)
2. Initialize Prisma with `npx prisma init`
3. Create schema with Post model (PostgreSQL)
4. Set up Prisma client in `app/lib/prisma.ts` with Accelerate extension
5. Create seed file in `prisma/seed.ts`
6. Generate example routes:
   - `app/routes/posts.tsx` - List all posts
   - `app/routes/posts.$postId.tsx` - View single post
   - `app/routes/posts.new.tsx` - Create new post
7. Update `package.json` with Prisma scripts

### Next Steps After Prisma Setup

1. Set your `DATABASE_URL` in `.env` file
2. Run `npm run db:push` to push schema to database
3. Run `npm run db:seed` to seed with example data
4. Run `npm run db:generate` to generate Prisma client
5. Start your development server

### Drizzle Integration

When you run `node script.mjs --orm drizzle`, the script will:

1. Install required dependencies (`drizzle-orm`, `drizzle-kit`, `@libsql/client`, etc.)
2. Create `drizzle.config.ts` for configuration
3. Create schema with Post model (SQLite with LibSQL)
4. Set up database connection in `app/db/index.ts`
5. Create seed file in `scripts/seed.ts`
6. Generate the same example routes as Prisma but using Drizzle syntax
7. Update `package.json` with Drizzle scripts
8. Create `.env.example` template

### Next Steps After Drizzle Setup

1. Copy `.env.example` to `.env` and set your `DATABASE_URL`
2. Run `npm run db:push` to push schema to database
3. Run `npm run db:seed` to seed with example data
4. Start your development server

For production, consider using [Turso](https://turso.tech/) for a scalable SQLite solution.

### Other Options

- `--help` - Show help information
- `--version` - Show version number

## Examples

### Interactive Mode Examples

```bash
# Start interactive mode - choose multiple features with checkboxes
node script.mjs

# Example interaction:
# ? Which database integration would you like to add? 🗄️  Prisma ORM (PostgreSQL)
# ? Which authentication integration would you like to add? 🔐  Better Auth  
# ? Include example routes? (Posts CRUD operations for learning/testing) Yes
```

### Command Line Examples

```bash
# Set up Prisma (follows official tutorial exactly)
node script.mjs --orm prisma

# Set up Drizzle
node script.mjs --db drizzle

# Set up Better Auth
node script.mjs --auth better-auth

# Combine multiple integrations
node script.mjs --orm prisma --auth better-auth

# Skip example routes
node script.mjs --orm drizzle --no-routes
```

### When to Use Each Mode

- **Interactive Mode**: First-time setup, exploring options, multiple integrations
- **CLI Arguments**: Automation, CI/CD pipelines, quick single feature addition
