#!/bin/bash

# Setup script specifically for React Router 7 + Prisma following official docs
# This prepares your project for Railway deployment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[STATUS]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}React Router 7 + Prisma + Railway Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if we're in a React Router project
if [ ! -f "package.json" ] || ! grep -q "react-router" package.json; then
    print_error "This doesn't appear to be a React Router project"
    print_warning "Please run this from your React Router 7 project root"
    exit 1
fi

# Step 1: Install Prisma dependencies (following official docs)
print_status "Installing Prisma dependencies..."
npm install prisma tsx --save-dev
npm install @prisma/client
print_success "Dependencies installed"

# Step 2: Initialize Prisma with custom output directory
print_status "Initializing Prisma..."
if [ ! -d "prisma" ]; then
    npx prisma init --datasource-provider postgresql
    
    # Update the schema.prisma to match React Router 7 docs
    cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
}
EOF
    print_success "Prisma initialized with React Router 7 schema"
else
    print_warning "Prisma already initialized, updating schema output path..."
    # Update just the generator output in existing schema
    sed -i.bak '/generator client {/,/}/ s|output.*|output   = "../app/generated/prisma"|' prisma/schema.prisma
fi

# Step 3: Create the Prisma client file as per docs
print_status "Creating Prisma client singleton..."
mkdir -p app/lib
cat > app/lib/prisma.ts << 'EOF'
import { PrismaClient } from "../generated/prisma/client.js";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
EOF
print_success "Prisma client created"

# Step 4: Create seed file following React Router 7 docs
print_status "Creating seed file..."
cat > prisma/seed.ts << 'EOF'
import { PrismaClient, Prisma } from "../app/generated/prisma/client.js";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    name: "Alice",
    email: "alice@prisma.io",
    posts: {
      create: [
        {
          title: "Join the Prisma Discord",
          content: "https://pris.ly/discord",
          published: true,
        },
        {
          title: "Prisma on YouTube",
          content: "https://pris.ly/youtube",
        },
      ],
    },
  },
  {
    name: "Bob",
    email: "bob@prisma.io",
    posts: {
      create: [
        {
          title: "Follow Prisma on Twitter",
          content: "https://www.twitter.com/prisma",
          published: true,
        },
      ],
    },
  },
];

export async function main() {
  console.log(`Start seeding ...`)
  for (const u of userData) {
    const user = await prisma.user.create({
      data: u,
    });
    console.log(`Created user with id: ${user.id}`);
  }
  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
EOF
print_success "Seed file created"

# Step 5: Update package.json with Prisma scripts and seed config
print_status "Updating package.json..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add Prisma seed configuration
pkg.prisma = { seed: 'tsx prisma/seed.ts' };

// Update scripts for Railway deployment
pkg.scripts = pkg.scripts || {};
pkg.scripts['build'] = pkg.scripts['build'] || 'react-router build';
pkg.scripts['start'] = pkg.scripts['start'] || 'react-router-serve ./build/server/index.js';
pkg.scripts['migrate:dev'] = 'prisma migrate dev';
pkg.scripts['migrate:deploy'] = 'prisma migrate deploy';
pkg.scripts['db:seed'] = 'prisma db seed';
pkg.scripts['studio'] = 'prisma studio';
pkg.scripts['postinstall'] = 'prisma generate';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
print_success "package.json updated"

# Step 6: Create Railway-specific configuration
print_status "Creating Railway configuration..."
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npx prisma generate --generator client && npm run build"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "providers": ["node"]
}
EOF
print_success "railway.json created"

# Step 7: Create/Update .env and .gitignore
print_status "Setting up environment files..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# Local development database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Railway will override this in production
EOF
fi

if [ ! -f ".env.example" ]; then
    echo "DATABASE_URL=" > .env.example
fi

if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
fi

if ! grep -q "^/app/generated$" .gitignore 2>/dev/null; then
    echo "/app/generated" >> .gitignore
fi

print_success "Environment files configured"

# Step 8: Add tsconfig path for generated Prisma client
print_status "Updating TypeScript configuration..."
if [ -f "tsconfig.json" ]; then
    node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    // Ensure compilerOptions exists
    config.compilerOptions = config.compilerOptions || {};
    
    // Add paths for Prisma generated client
    config.compilerOptions.paths = config.compilerOptions.paths || {};
    config.compilerOptions.paths['~/generated/prisma/*'] = ['./app/generated/prisma/*'];
    
    // Ensure module resolution works
    config.compilerOptions.moduleResolution = 'node';
    config.compilerOptions.esModuleInterop = true;
    
    fs.writeFileSync('tsconfig.json', JSON.stringify(config, null, 2));
    "
    print_success "TypeScript configuration updated"
fi

# Final instructions
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. For LOCAL development with LOCAL PostgreSQL:"
echo "   - Update DATABASE_URL in .env with your local PostgreSQL"
echo "   - Run: npx prisma migrate dev --name init"
echo "   - Run: npm run db:seed"
echo "   - Run: npm run dev"
echo ""
echo "2. For RAILWAY deployment:"
echo "   - Run the deployment script: ./deploy-to-railway.sh"
echo "   - The deployment script will:"
echo "     • Create a Railway project"
echo "     • Provision PostgreSQL"
echo "     • Run migrations automatically"
echo "     • Deploy your app"
echo ""
echo "3. Your Prisma client will be generated at:"
echo "   app/generated/prisma/"
echo ""
print_warning "Note: The generated Prisma client is gitignored by default"
print_warning "Railway will generate it during the build process"
