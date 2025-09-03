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

### Core Structure
- **Single file architecture**: All functionality in `script.mjs` 
- **Hybrid execution modes**: CLI arguments (`yargs`) + interactive prompts (`inquirer`)
- **Validation layer**: Comprehensive Zod schemas for all inputs and operations
- **Integration functions**: Modular functions for each technology stack

### Key Integration Functions
- `integratePrisma()` - PostgreSQL with Prisma ORM following official React Router 7 guide
- `integrateDrizzle()` - SQLite/LibSQL with Drizzle ORM  
- `integrateBetterAuthWithPrisma()` - Better Auth with Prisma adapter
- `integrateBetterAuthWithDrizzle()` - Better Auth with Drizzle adapter
- `integrateBetterAuth()` - Standalone Better Auth setup

### Validation Strategy
- **Script-level validation only**: All Zod validation applies to script internals, not generated user code
- **Safe parsing utilities**: `safeParseJson()`, `safeParseInt()`, `validatePackageJson()`
- **Input validation**: CLI args and interactive answers validated before execution
- **File operation safety**: JSON parsing and package.json manipulation protected with validation

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

## Important Constraints

- **No generated code validation**: Don't add validation to code snippets that get dropped into user codebases
- **React Router 7 patterns**: Generated routes use loaders/actions, not hooks like useLoaderData
- **Database assumptions**: Prisma uses PostgreSQL, Drizzle uses SQLite/LibSQL with Turso for production
- **Package.json safety**: Always validate and preserve existing scripts when updating