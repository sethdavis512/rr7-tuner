# RR7 Tuner - Copilot Instructions

## Project Overview

RR7 Tuner is a CLI tool that adds production-ready integrations to React Router 7 applications. It generates database-specific code following official tutorials exactly, with smart detection to prevent redundant setups.

## Architecture & Key Patterns

### Modular Integration System

The codebase uses a modular architecture where each integration (`lib/integrations/`) is self-contained:

-   **Single responsibility**: Each module handles one specific integration
-   **Consistent patterns**: All integrations follow the same structure with smart detection, dependency installation, file generation, and route registration
-   **Adapter-aware**: Better Auth automatically selects correct database adapter based on ORM choice

### Code Generation Philosophy

-   **Tutorial compliance**: Generated code matches official documentation exactly (e.g., Prisma follows https://www.prisma.io/docs/guides/react-router-7)
-   **Database-specific**: Schema, connection, and config code tailored to chosen database type
-   **No validation in user code**: Don't add validation utilities to generated code snippets that get dropped into user codebases

### Smart Detection System

All integrations implement comprehensive checks to prevent redundant operations:

```typescript
// Pattern used throughout integrations
const authServerExists = await fileExists('app/lib/auth.server.ts');
const authDepsExist = await dependenciesExist([
    'better-auth',
    '@better-auth/cli'
]);
if (authDepsExist) {
    printWarning('Dependencies already installed, skipping');
} else {
    await $`npm install better-auth @better-auth/cli`;
}
```

### Database Type Mapping

The tool maintains separate database type systems for each ORM:

-   **Prisma**: `postgresql`, `mysql`, `sqlite`, `mongodb`, `sqlserver`, `cockroachdb`
-   **Drizzle**: `postgres`, `neon`, `vercel-postgres`, `supabase`, `mysql`, `planetscale`, `sqlite`, `turso`, `d1`

### Route Registration System

Automatic route registration in `app/routes.ts` with smart import management:

```typescript
// Only updates if routes.ts exists, appends to existing routes
await updateRoutesFile([
    { path: '/posts', file: 'routes/posts/route.tsx' },
    { path: '/posts/:postId', file: 'routes/posts.$postId/route.tsx' }
]);
```

## Development Workflow

### Primary Commands

```bash
# Interactive mode (recommended for development/testing)
bun script.ts

# CLI mode with validation
bun script.ts --orm prisma --database-type postgresql --auth better-auth
bun script.ts --db drizzle --dt turso --services polar

# Development checks
bun --check script.ts     # Type checking
bun test                  # Run tests
```

### Key Utilities (lib/utils/)

-   **`console.ts`**: Consistent emoji-based output formatting (`printStep`, `printSuccess`, `printWarning`)
-   **`file-operations.ts`**: Safe JSON operations, file existence checks, route registration
-   **`package-manager.ts`**: Package.json manipulation with validation

### Adding New Integrations

1. Create module in `lib/integrations/[name].ts`
2. Export main function with JSDoc: `export async function integrate[Name]()`
3. Use utilities: `printStep()`, `fileExists()`, `dependenciesExist()`
4. Add route registration with `updateRoutesFile()` if needed
5. Update `lib/orchestrator.ts` to wire up the integration
6. Add validation schemas to `lib/validation/schemas.ts`

## Critical Implementation Details

### Error Handling Pattern

```typescript
// All integrations use this pattern
try {
    await $`npm install dependencies`;
    printSuccess('Dependencies installed');
} catch (error) {
    printWarning('Installation failed - you may need to run this manually');
}
```

### ORM-Specific Code Generation

Each database type has unique configuration requirements:

```typescript
// Example: Drizzle provider mapping
const providerMap: Record<string, string> = {
    postgres: 'pg',
    neon: 'pg',
    supabase: 'pg',
    planetscale: 'mysql',
    turso: 'sqlite',
    d1: 'sqlite'
};
```

### Route Generation Standards

-   Use React Router 7 patterns (loaders/actions, not hooks)
-   Generate complete CRUD examples for learning
-   Include proper TypeScript types: `type Route = ./+types/route`
-   Follow directory-based routing conventions

## Important Constraints

-   **No generated validation**: Don't add Zod or other validation to user-facing code snippets
-   **Preserve existing files**: Always check `fileExists()` before creating files
-   **Package.json safety**: Use `updatePackageJsonScripts()` to preserve existing configuration
-   **Module imports**: Use relative imports for local modules, absolute for npm packages
-   **Bun compatibility**: Leverage Bun's native TypeScript support and performance optimizations
