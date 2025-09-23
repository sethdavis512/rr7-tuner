# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RR7 Tuner is a React Router 7 enhancement CLI tool that adds production-ready integrations (Prisma, Drizzle, Better Auth) to React Router 7 applications. The tool generates database-specific code following official tutorials exactly.

## Commands

### Primary Usage
```bash
# Run the tool (interactive mode)
bun script.ts

# CLI mode with specific integrations
bun script.ts --orm prisma --database-type postgresql
bun script.ts --db drizzle --dt turso
bun script.ts --auth better-auth
bun script.ts --orm prisma --database-type mysql --auth better-auth --no-routes

# Include services (Railway deployment, Polar.sh payments)
bun script.ts --orm prisma --services railway
bun script.ts --auth better-auth --services polar railway

# Development commands
bun script.ts --help
bun script.ts --version
bun --check script.ts    # Type checking
bun test                 # Run tests
bun run typecheck        # TypeScript validation
```

### Development Dependencies
- Uses Bun runtime with native TypeScript support
- Built-in test runner with `bun test`
- TypeScript configuration optimized for Bun
- Dependencies: inquirer, yargs, zod
- Dev Dependencies: typescript, @types/*, bun-types

## Architecture

### Modular Structure
The codebase follows enterprise-ready patterns with clear separation of concerns:

```
lib/
├── cli/
│   ├── arguments.ts        # CLI argument parsing (yargs)
│   └── interactive.ts      # Interactive prompts (inquirer)
├── integrations/
│   ├── prisma.ts          # Complete Prisma setup
│   ├── drizzle.ts         # Complete Drizzle setup
│   ├── better-auth.ts     # Better Auth with all adapters
│   ├── polar.ts           # Polar.sh payments integration
│   └── railway.ts         # Railway deployment integration
├── utils/
│   ├── console.ts         # Consistent output formatting
│   ├── file-operations.ts # Safe file I/O operations
│   └── package-manager.ts # Package.json manipulation
├── validation/
│   ├── schemas.ts         # Zod validation schemas
│   └── validators.ts      # Validation functions
└── orchestrator.ts        # Main coordination logic
script.ts                  # Entry point with error handling
```

### Key Integration Functions
- `integratePrisma(includeRoutes, databaseType, railwayDeployment)` - Supports PostgreSQL, MySQL, SQLite, MongoDB, SQL Server, CockroachDB
- `integrateDrizzle(includeRoutes, databaseType)` - Supports PostgreSQL, MySQL, SQLite variants (Turso, D1, Neon, PlanetScale, etc.)
- `integrateBetterAuthWithPrisma()` - Better Auth with Prisma adapter
- `integrateBetterAuthWithDrizzle()` - Better Auth with Drizzle adapter
- `integrateBetterAuth()` - Standalone Better Auth setup
- `integratePolar(authType)` - Polar.sh payments integration with Better Auth
- `integrateRailway()` - Railway deployment platform configuration

### Database Type Support Matrix
**Prisma** (6 types): `postgresql`, `mysql`, `sqlite`, `mongodb`, `sqlserver`, `cockroachdb`
**Drizzle** (9 types): `postgres`, `neon`, `vercel-postgres`, `supabase`, `mysql`, `planetscale`, `sqlite`, `turso`, `d1`

### Enterprise Patterns
- **Modular design**: Each concern separated into dedicated modules
- **Type safety**: Full TypeScript with strict typing throughout
- **Runtime performance**: Bun's fast JavaScript runtime for better performance
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Validation layer**: Zod schemas for all inputs and operations
- **Consistent logging**: Standardized console output with emojis and formatting

### Code Generation Patterns  
- **Tutorial compliance**: Generated code matches official documentation exactly
- **Database-specific generation**: Schema, connection, and config code tailored to chosen database type
- **File system operations**: Creates directories, writes files, updates package.json
- **Smart dependency installation**: Installs correct database drivers based on database type selection
- **Route generation**: Complete CRUD examples with proper React Router 7 patterns
- **Authentication pages**: Signup, signin, dashboard routes for Better Auth
- **Payment routes**: Checkout success, customer portal, and upgrade pages for Polar.sh
- **Railway deployment**: Production-ready configuration files and deployment scripts
- **Automatic route registration**: Generated routes are automatically registered in `app/routes.ts` if it exists

### Integration Philosophy
- **Official tutorial adherence**: Prisma integration follows https://www.prisma.io/docs/guides/react-router-7 exactly
- **Technology-specific patterns**: Drizzle uses "the Drizzle way" while maintaining equivalent functionality
- **Adapter-aware auth**: Better Auth automatically selects correct database adapter based on ORM choice
- **Clean generated code**: No validation utilities in user-facing code snippets

### Route Registration System
The tool includes automatic route registration functionality that integrates generated routes into React Router 7's configuration:

- **Conditional registration**: Only updates `app/routes.ts` if the file already exists
- **Append-only approach**: New routes are added to existing configuration without replacement
- **Import management**: Automatically adds `route` import when needed for non-index routes
- **Integration-specific routes**:
  - **ORM routes**: `/posts`, `/posts/:postId`, `/posts/new` (for both Prisma and Drizzle)
  - **Auth routes**: `/signup`, `/signin`, `/dashboard` (for Better Auth)
  - **Payment routes**: `/success`, `/portal`, `/upgrade` (for Polar.sh)
- **Railway deployment configurations**:
  - **railway.json**: Production deployment configuration
  - **Package.json scripts**: Build, start, migrate:deploy, postinstall
  - **Environment setup**: .env templates and gitignore updates

### Smart Detection Features
All integrations include intelligent detection to prevent redundant operations:

- **Dependency checking**: Verifies if required packages are already installed before running `npm install`
- **File existence checks**: Skips file creation if target files already exist
- **Configuration validation**: Checks for existing scripts in package.json before updating
- **Schema detection**: Validates existing database schemas and configurations

## Development Guidelines

### Adding New Integrations
1. Create new module in `lib/integrations/[name].ts`
2. Export main integration function with JSDoc annotations
3. Use utility functions from `lib/utils/` for file operations
4. Add validation schemas to `lib/validation/schemas.ts` if needed
5. Update orchestrator to include new integration option
6. Add CLI argument and interactive prompt options

### Modifying Existing Integrations
1. Locate the integration module in `lib/integrations/`
2. Use consistent console output from `lib/utils/console.ts`
3. Leverage file operation utilities from `lib/utils/file-operations.ts`
4. Update package.json safely using `lib/utils/package-manager.ts`
5. Use `updateRoutesFile()` to register generated routes in `app/routes.ts`

### File Organization Principles
- **Single Responsibility**: Each module handles one specific concern
- **Dependency Direction**: Modules should only import from utilities, not other integrations
- **Error Handling**: All async operations should have proper try-catch with user-friendly messages
- **Validation**: Use Zod schemas for all external input validation

## Important Constraints

- **No generated code validation**: Don't add validation to code snippets that get dropped into user codebases
- **React Router 7 patterns**: Generated routes use loaders/actions, not hooks like useLoaderData
- **Database type consistency**: Ensure database-specific imports, schemas, and configs match the selected type
- **Package.json safety**: Always validate and preserve existing scripts when updating
- **Module imports**: Use relative imports for local modules, absolute for npm packages
- **ORM-specific validation**: Prisma and Drizzle database types use different naming conventions and must be mapped correctly
- **Route registration**: Only register routes in `app/routes.ts` if the file already exists, append to existing routes without replacement
- **Smart detection**: Check for existing files, dependencies, and configurations to prevent redundant setup operations

## CLI Argument Structure

```bash
# Full CLI syntax
bun script.ts [--orm|--db <orm>] [--database-type|--dt <type>] [--auth <auth>] [--services|-s <service>] [--routes|--no-routes|-r]

# Interactive flow
bun script.ts
# → Choose ORM (prisma/drizzle/none)
# → Choose database type (dynamic based on ORM)
# → Choose auth (better-auth/none)
# → Choose services (polar/railway/none)
# → Choose routes (yes/no)

# Railway deployment examples
bun script.ts --orm prisma --services railway
bun script.ts --orm prisma --auth better-auth --services railway polar
```

## Railway Integration

The Railway integration provides production deployment configuration for React Router 7 + Prisma projects:

### Railway + Prisma Coordination
When Railway service is selected with Prisma (`--orm prisma --services railway`):
- Prisma schema uses Railway-compatible output directory (`../app/generated/prisma`)
- Railway-specific Prisma client configuration with custom import paths
- Railway-compatible seed file with User/Post models (matches Railway tutorial)
- Production deployment scripts (migrate:deploy, postinstall, build, start)

### Railway Standalone Features
- Creates `railway.json` with Nixpacks build configuration
- Updates package.json with production deployment scripts
- Sets up environment files (.env, .env.example)
- Updates TypeScript paths for Prisma generated client
- Updates .gitignore for Railway deployment artifacts

### Railway Detection Logic
```typescript
// Railway integration checks for existing configurations
const railwayConfigExists = await fileExists('railway.json');
const scriptsExist = Object.keys(railwayScripts).every(script => script in existingScripts);
// Only creates/updates if configurations don't already exist
```