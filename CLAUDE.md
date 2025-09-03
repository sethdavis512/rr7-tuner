# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RR7 Tuner is a React Router 7 enhancement CLI tool that adds production-ready integrations (Prisma, Drizzle, Better Auth) to React Router 7 applications. The tool generates code following official tutorials exactly.

## Commands

### Primary Usage
```bash
# Run the tool
node script.mjs

# CLI mode with specific integrations
node script.mjs --orm prisma
node script.mjs --db drizzle  
node script.mjs --auth better-auth
node script.mjs --orm prisma --auth better-auth
```

### Development Dependencies
- No test runner configured (package.json shows placeholder test script)
- Uses zx for shell scripting with Node.js
- Dependencies: inquirer, yargs, zod, zx

## Architecture

### Modular Structure
The codebase follows enterprise-ready patterns with clear separation of concerns:

```
lib/
├── cli/
│   ├── arguments.mjs       # CLI argument parsing (yargs)
│   └── interactive.mjs     # Interactive prompts (inquirer)
├── integrations/
│   ├── prisma.mjs         # Complete Prisma setup
│   ├── drizzle.mjs        # Complete Drizzle setup
│   └── better-auth.mjs    # Better Auth with all adapters
├── utils/
│   ├── console.mjs        # Consistent output formatting
│   ├── file-operations.mjs # Safe file I/O operations
│   └── package-manager.mjs # Package.json manipulation
├── validation/
│   ├── schemas.mjs        # Zod validation schemas
│   └── validators.mjs     # Validation functions
└── orchestrator.mjs       # Main coordination logic
script.mjs                 # Entry point with error handling
```

### Key Integration Functions
- `integratePrisma(includeRoutes)` - PostgreSQL with Prisma ORM following official React Router 7 guide
- `integrateDrizzle(includeRoutes)` - SQLite/LibSQL with Drizzle ORM  
- `integrateBetterAuthWithPrisma()` - Better Auth with Prisma adapter
- `integrateBetterAuthWithDrizzle()` - Better Auth with Drizzle adapter
- `integrateBetterAuth()` - Standalone Better Auth setup

### Enterprise Patterns
- **Modular design**: Each concern separated into dedicated modules
- **Type safety**: JSDoc annotations throughout for better IDE support
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Validation layer**: Zod schemas for all inputs and operations
- **Consistent logging**: Standardized console output with emojis and formatting

### Code Generation Patterns  
- **Tutorial compliance**: Generated code matches official documentation exactly
- **File system operations**: Creates directories, writes files, updates package.json
- **Database setup**: Schema files, connection configs, seed scripts
- **Route generation**: Complete CRUD examples with proper React Router 7 patterns
- **Authentication pages**: Signup, signin, dashboard routes for Better Auth

### Integration Philosophy
- **Official tutorial adherence**: Prisma integration follows https://www.prisma.io/docs/guides/react-router-7 exactly
- **Technology-specific patterns**: Drizzle uses "the Drizzle way" while maintaining equivalent functionality
- **Adapter-aware auth**: Better Auth automatically selects correct database adapter based on ORM choice
- **Clean generated code**: No validation utilities in user-facing code snippets

## Development Guidelines

### Adding New Integrations
1. Create new module in `lib/integrations/[name].mjs`
2. Export main integration function with JSDoc annotations
3. Use utility functions from `lib/utils/` for file operations
4. Add validation schemas to `lib/validation/schemas.mjs` if needed
5. Update orchestrator to include new integration option
6. Add CLI argument and interactive prompt options

### Modifying Existing Integrations
1. Locate the integration module in `lib/integrations/`
2. Use consistent console output from `lib/utils/console.mjs`
3. Leverage file operation utilities from `lib/utils/file-operations.mjs`
4. Update package.json safely using `lib/utils/package-manager.mjs`

### File Organization Principles
- **Single Responsibility**: Each module handles one specific concern
- **Dependency Direction**: Modules should only import from utilities, not other integrations
- **Error Handling**: All async operations should have proper try-catch with user-friendly messages
- **Validation**: Use Zod schemas for all external input validation

## Important Constraints

- **No generated code validation**: Don't add validation to code snippets that get dropped into user codebases
- **React Router 7 patterns**: Generated routes use loaders/actions, not hooks like useLoaderData
- **Database assumptions**: Prisma uses PostgreSQL, Drizzle uses SQLite/LibSQL with Turso for production
- **Package.json safety**: Always validate and preserve existing scripts when updating
- **Module imports**: Use relative imports for local modules, absolute for npm packages