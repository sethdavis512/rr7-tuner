# RR7 Tuner

A React Router 7 enhancement tool that helps you add production-ready features to your app following official tutorials.

## Features

- **Prisma Integration**: Complete setup following the [official Prisma React Router 7 guide](https://www.prisma.io/docs/guides/react-router-7)
- **Drizzle Integration**: SQLite/LibSQL setup with multiple database provider support  
- **Better Auth Integration**: Secure authentication with database adapters and OAuth support
- **Polar.sh Integration**: Payments and subscriptions with Better Auth integration
- **Railway Integration**: Production deployment configuration for React Router 7 + Prisma projects
- **Automatic Route Registration**: Generated routes are automatically registered in `app/routes.ts`
- **Smart Detection**: Prevents redundant setups by checking existing files and dependencies
- **Example Routes**: Full CRUD operations and authentication flows
- **TypeScript Support**: Proper types and configuration throughout

## Usage

The tool supports both **interactive mode** and **command line arguments** for maximum flexibility.

### Interactive Mode

Run without any arguments to start the interactive menu:

```bash
bun script.ts
```

This will prompt you with questions to select your ORM, specific database type, authentication, additional services (like Polar.sh and Railway), and whether to include example routes. Perfect for first-time setup or when you want to explore different integration options.

### Command Line Arguments

For automation, CI/CD, or when you know exactly what you want:

#### `--orm` / `--db`

Set up database integration with the specified ORM.

**Options:**

- `prisma` - Complete Prisma setup following React Router 7 tutorial
- `drizzle` - Complete Drizzle setup with React Router 7 patterns

**Example:**

```bash
bun script.ts --orm prisma
bun script.ts --db drizzle
```

#### `--database-type` / `--dt`

Specify the exact database type/provider to use with your chosen ORM.

**Prisma Options:**
- `postgresql` - PostgreSQL (default)
- `mysql` - MySQL/MariaDB  
- `sqlite` - SQLite
- `mongodb` - MongoDB
- `sqlserver` - Microsoft SQL Server
- `cockroachdb` - CockroachDB

**Drizzle Options:**
- `turso` - Turso SQLite (default)
- `postgres` - PostgreSQL
- `neon` - Neon PostgreSQL
- `vercel-postgres` - Vercel Postgres
- `supabase` - Supabase PostgreSQL
- `mysql` - MySQL
- `planetscale` - PlanetScale MySQL
- `sqlite` - Local SQLite
- `d1` - Cloudflare D1

**Examples:**

```bash
bun script.ts --orm prisma --database-type mysql
bun script.ts --db drizzle --dt neon
bun script.ts --orm prisma --database-type mongodb
```

#### `--auth`

Set up authentication with the specified provider.

**Options:**

- `better-auth` - Better Auth integration

**Example:**

```bash
bun script.ts --auth better-auth
```

#### `-s, --services`

Include additional service integrations.

**Options:**
- `polar` - Polar.sh payments and subscriptions integration
- `railway` - Railway deployment platform integration

**Examples:**

```bash
bun script.ts --services polar
bun script.ts --services railway
bun script.ts --auth better-auth --services polar railway
bun script.ts -s polar -s railway
```

#### `-r, --routes`

Include example routes (Posts CRUD operations for learning/testing).

**Options:**

- `true` (default) - Include example routes
- `false` - Skip example route generation

**Examples:**

```bash
bun script.ts --orm prisma --routes=false
bun script.ts --db drizzle --no-routes
```

### Prisma Integration

When you run `bun script.ts --orm prisma`, the script will:

1. Install required dependencies (`prisma`, `@prisma/client`, `@prisma/extension-accelerate`)
2. Initialize Prisma with `npx prisma init`
3. Create schema with Post model (PostgreSQL)
4. Set up Prisma client in `app/lib/prisma.ts` with Accelerate extension
5. Create seed file in `prisma/seed.ts`
6. Generate example routes:
   - `app/routes/posts.tsx` - List all posts
   - `app/routes/posts.$postId.tsx` - View single post
   - `app/routes/posts.new.tsx` - Create new post
7. Register routes in `app/routes.ts` (if it exists)
8. Update `package.json` with Prisma scripts

### Next Steps After Prisma Setup

1. Set your `DATABASE_URL` in `.env` file
2. Run `npm run db:push` to push schema to database
3. Run `npm run db:seed` to seed with example data
4. Run `npm run db:generate` to generate Prisma client
5. Start your development server

### Drizzle Integration

When you run `bun script.ts --orm drizzle`, the script will:

1. Install required dependencies (`drizzle-orm`, `drizzle-kit`, `@libsql/client`, etc.)
2. Create `drizzle.config.ts` for configuration
3. Create schema with Post model (SQLite with LibSQL)
4. Set up database connection in `app/db/index.ts`
5. Create seed file in `scripts/seed.ts`
6. Generate the same example routes as Prisma but using Drizzle syntax
7. Register routes in `app/routes.ts` (if it exists)
8. Update `package.json` with Drizzle scripts
9. Create `.env.example` template

### Next Steps After Drizzle Setup

1. Copy `.env.example` to `.env` and set your `DATABASE_URL`
2. Run `npm run db:push` to push schema to database
3. Run `npm run db:seed` to seed with example data
4. Start your development server

For production, consider using [Turso](https://turso.tech/) for a scalable SQLite solution.

### Better Auth Integration

When you run `bun script.ts --auth better-auth`, the script will:

1. Install Better Auth dependencies (`better-auth`)
2. Create server-side auth configuration with database adapter
3. Create client-side auth configuration
4. Generate authentication pages:
   - `/signup` - User registration page
   - `/signin` - User login page
   - `/dashboard` - Protected user dashboard
5. Register routes in `app/routes.ts` (if it exists)
6. Create API route handler at `/api/auth/*`

### Next Steps After Better Auth Setup

1. Configure your authentication providers in the auth config
2. Set up environment variables for OAuth providers (if using)
3. Run database migrations to create auth tables
4. Start your development server and test authentication flow

Better Auth provides secure authentication with support for multiple providers, sessions, and database adapters.

### Polar.sh Integration

When you run `bun script.ts --services polar`, the script will:

1. Install required dependencies (`@polar-sh/sdk`, `@polar-sh/better-auth`)
2. Update Better Auth configuration with Polar plugin
3. Add Polar client configuration for checkout and customer portal
4. Create React Router 7 routes:
   - `/success` - Checkout success page
   - `/portal` - Customer portal redirect
   - `/upgrade` - Upgrade/checkout page
5. Register routes in `app/routes.ts` (if it exists)
6. Update `.env.example` with Polar configuration variables

### Next Steps After Polar.sh Setup

1. Create a Polar.sh account at [polar.sh](https://polar.sh)
2. Get your access token from dashboard settings
3. Set up webhook endpoints for payment events
4. Configure your products and pricing
5. Update environment variables in `.env` file

Polar.sh provides checkout, customer portal, usage tracking, and webhooks for React Router 7 applications.

### Railway Integration

When you run `bun script.ts --services railway`, the script will:

1. Create Railway deployment configuration (`railway.json`)
2. Update `package.json` with production deployment scripts:
   - `build` - React Router 7 build command
   - `start` - Production server start command
   - `migrate:deploy` - Prisma production migrations
   - `postinstall` - Generate Prisma client on deployment
3. Set up environment files (`.env`, `.env.example`)
4. Update TypeScript configuration for Prisma generated client paths
5. Update `.gitignore` for Railway deployment files

**Railway + Prisma Setup:**

When Railway is combined with Prisma (`--orm prisma --services railway`), additional Railway-specific configurations are applied:

- Prisma schema uses custom output directory (`../app/generated/prisma`)
- Railway-compatible Prisma client configuration
- Railway-specific seed file with User/Post models
- Production migration scripts for Railway deployment

### Next Steps After Railway Setup

1. Create a Railway account at [railway.app](https://railway.app)
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login to Railway: `railway login`
4. Initialize project: `railway init`
5. Add PostgreSQL database: `railway add postgresql`
6. Deploy: `railway up`

Railway will automatically:
- Run `npx prisma migrate deploy` to set up your database
- Generate the Prisma client during build
- Start your React Router 7 application

### Other Options

- `--help` - Show help information
- `--version` - Show version number

## Examples

### Interactive Mode Examples

```bash
# Start interactive mode - choose multiple features with checkboxes
bun script.ts

# Example interaction:
# ? Which database integration would you like to add? 🗄️  Prisma ORM
# ? Which Prisma database type would you like to use? 🐘  PostgreSQL
# ? Which authentication integration would you like to add? 🔐  Better Auth
# ? Which additional services would you like to integrate? ✔ 💰 Polar.sh (Payments & Subscriptions), ✔ 🚄 Railway (Deployment Platform)
# ? Include example routes? (Posts CRUD operations for learning/testing) Yes
```

### Command Line Examples

```bash
# Set up Prisma (follows official tutorial exactly)
bun script.ts --orm prisma

# Set up Drizzle
bun script.ts --db drizzle

# Set up Better Auth
bun script.ts --auth better-auth

# Combine multiple integrations
bun script.ts --orm prisma --auth better-auth

# Specify database type
bun script.ts --orm prisma --database-type mysql
bun script.ts --db drizzle --dt neon

# Skip example routes
bun script.ts --orm drizzle --no-routes

# Include services
bun script.ts --auth better-auth --services polar
bun script.ts --orm prisma --services railway

# Railway deployment setup with Prisma
bun script.ts --orm prisma --database-type postgresql --services railway

# Full stack with Railway deployment
bun script.ts --orm prisma --auth better-auth --services polar railway

# Full example with all options
bun script.ts --orm drizzle --database-type planetscale --auth better-auth --services polar --no-routes
```

## Railway Deployment Examples

### Basic Railway Setup

```bash
# Basic Railway deployment configuration
bun script.ts --services railway

# Railway with Prisma (recommended for production)
bun script.ts --orm prisma --services railway

# Railway with specific database type
bun script.ts --orm prisma --database-type postgresql --services railway
```

### Full Stack Railway Deployment

```bash
# Complete production setup with authentication and payments
bun script.ts --orm prisma --auth better-auth --services railway polar

# MySQL with Railway deployment
bun script.ts --orm prisma --database-type mysql --services railway

# Railway deployment without example routes (cleaner production setup)
bun script.ts --orm prisma --services railway --no-routes
```

### Interactive Railway Setup

```bash
# Use interactive mode to select Railway along with other services
bun script.ts
# Then select:
# - Database: Prisma ORM
# - Database Type: PostgreSQL (or your preference)
# - Auth: Better Auth (optional)
# - Services: ✓ Railway (Deployment Platform)
```

### When to Use Each Mode

- **Interactive Mode**: First-time setup, exploring options, multiple integrations
- **CLI Arguments**: Automation, CI/CD pipelines, quick single feature addition
- **Railway Integration**: When you need production deployment configuration
