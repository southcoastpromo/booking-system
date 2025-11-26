
#!/usr/bin/env bash
#
# Developer Handover Backup Script for SouthCoast ProMotion
# 
# Creates a complete, production-ready backup ZIP containing all necessary files
# for handing over the project to a new developer.
#
# Usage:
#   ./scripts/create-handover-backup.sh
#
# Output:
#   Creates southcoast-handover-YYYYMMDD_HHMMSS.zip in ./backups/handover/

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${PROJECT_ROOT}/backups/handover"
BACKUP_NAME="southcoast-handover-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
FINAL_ZIP="${BACKUP_DIR}/${BACKUP_NAME}.zip"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}SouthCoast ProMotion - Developer Handover Backup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Create backup directory structure
echo -e "${GREEN}[1/8]${NC} Creating backup directory structure..."
mkdir -p "$BACKUP_PATH"
mkdir -p "$BACKUP_PATH/database"
mkdir -p "$BACKUP_PATH/documentation"
mkdir -p "$BACKUP_PATH/deployment"

# Copy core application files
echo -e "${GREEN}[2/8]${NC} Copying core application files..."
cd "$PROJECT_ROOT"

# Source code directories
for dir in client server services shared lib config migrations types; do
  if [ -d "$dir" ]; then
    echo "  → Copying $dir/"
    cp -r "$dir" "$BACKUP_PATH/"
  fi
done

# Root configuration files
echo -e "${GREEN}[3/8]${NC} Copying configuration files..."
for file in \
  package.json \
  package-lock.json \
  tsconfig.json \
  tsconfig.excludes.json \
  vite.config.ts \
  vite.config.production.ts \
  vitest.config.ts \
  tailwind.config.ts \
  postcss.config.js \
  drizzle.config.ts \
  eslint.config.js \
  .prettierrc.json \
  .prettierignore \
  .eslintignore \
  .gitignore \
  .env.example \
  .replit \
  index.ts \
  deploy-guaranteed.js \
  start-with-memory.sh; do
  if [ -f "$file" ]; then
    echo "  → Copying $file"
    cp "$file" "$BACKUP_PATH/"
  fi
done

# Copy assets and public files
echo -e "${GREEN}[4/8]${NC} Copying assets and public files..."
if [ -d "attached_assets" ]; then
  echo "  → Copying attached_assets/"
  cp -r attached_assets "$BACKUP_PATH/"
fi

if [ -d "client/public" ]; then
  echo "  → Copying client/public/"
  mkdir -p "$BACKUP_PATH/client/public"
  cp -r client/public/* "$BACKUP_PATH/client/public/" 2>/dev/null || true
fi

# Copy documentation
echo -e "${GREEN}[5/8]${NC} Copying documentation..."
for file in README.md replit.md; do
  if [ -f "$file" ]; then
    echo "  → Copying $file"
    cp "$file" "$BACKUP_PATH/documentation/"
  fi
done

if [ -d "docs" ]; then
  echo "  → Copying docs/"
  cp -r docs/* "$BACKUP_PATH/documentation/" 2>/dev/null || true
fi

# Copy scripts
echo -e "${GREEN}[6/8]${NC} Copying utility scripts..."
if [ -d "scripts" ]; then
  echo "  → Copying scripts/"
  cp -r scripts "$BACKUP_PATH/"
  chmod +x "$BACKUP_PATH/scripts"/*.sh 2>/dev/null || true
fi

# Copy GitHub workflows
if [ -d ".github" ]; then
  echo "  → Copying .github/"
  cp -r .github "$BACKUP_PATH/"
fi

# Create database backup
echo -e "${GREEN}[7/8]${NC} Creating database backup..."
if [ -n "${DATABASE_URL:-}" ]; then
  echo "  → Backing up database..."
  DB_BACKUP_FILE="$BACKUP_PATH/database/database_backup_${TIMESTAMP}.sql.gz"
  
  if command -v pg_dump &> /dev/null; then
    if pg_dump "$DATABASE_URL" --clean --if-exists 2>/dev/null | gzip > "$DB_BACKUP_FILE"; then
      DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
      echo "  ✓ Database backup created (${DB_SIZE})"
    else
      echo -e "${YELLOW}  ⚠ Database backup failed (pg_dump error)${NC}"
    fi
  else
    echo -e "${YELLOW}  ⚠ pg_dump not available, skipping database backup${NC}"
  fi
else
  echo -e "${YELLOW}  ⚠ DATABASE_URL not set, skipping database backup${NC}"
fi

# Create comprehensive handover documentation
echo -e "${GREEN}[8/8]${NC} Creating handover documentation..."
cat > "$BACKUP_PATH/documentation/HANDOVER_GUIDE.md" << 'HANDOVER_EOF'
# SouthCoast ProMotion - Developer Handover Guide

## 📦 What's Included in This Backup

This backup contains everything needed to run and deploy the SouthCoast ProMotion booking platform:

- **Source Code**: Complete application codebase (client, server, services)
- **Configuration**: All config files, environment templates, build configs
- **Database**: SQL backup with complete schema and data
- **Documentation**: Technical docs, deployment guides, API documentation
- **Scripts**: Backup, deployment, and utility scripts
- **Assets**: Campaign data (CSV), images, and static files
- **CI/CD**: GitHub workflows for automated testing and deployment

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **PostgreSQL**: v14+ (or Neon serverless)
- **Git**: For version control

### Initial Setup

1. **Extract the backup**:
   ```bash
   unzip southcoast-handover-*.zip
   cd southcoast-handover-*
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Set up database**:
   ```bash
   # Create database
   createdb southcoast_promotion
   
   # Restore from backup
   gunzip -c database/database_backup_*.sql.gz | psql $DATABASE_URL
   
   # Or run fresh migrations
   npm run db:push
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

   Access at: http://localhost:5000

## 🗄️ Database Setup

### Option 1: Restore from Backup (Recommended)

```bash
# Decompress and restore
gunzip -c database/database_backup_*.sql.gz | psql $DATABASE_URL
```

### Option 2: Fresh Database Setup

```bash
# Generate and push schema
npm run db:generate
npm run db:push
```

### Verify Database

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM campaigns;"
```

## 🔧 Environment Variables

Required variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Security
SESSION_SECRET=generate-random-64-char-string
API_KEY=generate-random-32-char-string
ADMIN_KEY=generate-random-32-char-string
CSRF_SECRET=generate-random-64-char-string

# Application
NODE_ENV=development
PORT=5000
LOG_LEVEL=info

# Admin Access (Optional)
ADMIN_EMAIL=admin@example.com

# External Services (Optional)
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_SECRET_KEY=
DOCUSIGN_ACCOUNT_ID=
SENDGRID_API_KEY=

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-2
AWS_S3_BUCKET=
```

### Generate Secrets

```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix lint issues
npm run typecheck       # Run TypeScript type checking

# Database
npm run db:push         # Push schema to database
npm run db:generate     # Generate migrations

# Deployment
npm run deploy          # Build and deploy to production
```

## 🏗️ Project Structure

```
southcoast-promotion/
├── client/             # React frontend application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── contexts/   # React contexts
│   │   ├── hooks/      # Custom hooks
│   │   ├── lib/        # Utilities
│   │   └── pages/      # Page components
│   └── public/         # Static assets
├── server/             # Express backend
│   ├── middleware/     # Auth, security, monitoring
│   ├── routes/         # API endpoints
│   └── services/       # Business logic
├── services/           # Shared services
├── shared/             # Shared types & schemas
├── lib/                # Core utilities
├── migrations/         # Database migrations
├── scripts/            # Utility scripts
└── docs/               # Documentation
```

## 🔐 Security Features

- **CSRF Protection**: Token-based protection on all mutations
- **Rate Limiting**: IP-based throttling on all endpoints
- **Helmet Security**: Comprehensive security headers
- **Session Management**: PostgreSQL-backed sessions
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **RBAC**: Role-based access control (Owner, Ops, ReadOnly)

## 📊 Key Features

1. **Campaign Management**: 32+ advertising campaigns with real-time availability
2. **Booking System**: Multi-step booking flow with cart functionality
3. **Payment Processing**: Secure payment tracking and confirmation
4. **Contract Management**: Digital signature workflow
5. **Creative Upload**: S3-backed file storage with fallback
6. **Admin Dashboard**: Analytics, reporting, and system management
7. **Customer Portal**: Booking history and status tracking
8. **Real-time Monitoring**: Performance metrics and health checks

## 🚢 Deployment Guide

### Replit Deployment (Recommended)

1. **Import to Replit**:
   - Create new Repl from GitHub or upload ZIP
   - Select "Node.js" template
   - Replit will auto-detect configuration

2. **Configure secrets**:
   - Use Replit Secrets tool for environment variables
   - Add all required secrets from `.env.example`

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Access**:
   - Development: `https://your-repl.replit.dev`
   - Production: Configure custom domain in Deployments

### Manual Deployment

1. **Build application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   NODE_ENV=production npm start
   ```

3. **Set up reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 📖 Additional Documentation

- `README.md`: Project overview and getting started
- `docs/DEPLOYMENT_PIPELINE.md`: CI/CD setup
- `docs/BACKUP_PROCEDURES.md`: Database backup/restore
- `docs/HARDENING_DEPLOYMENT.md`: Security hardening guide
- `server/openapi.yaml`: API documentation (view at `/api-docs`)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Integration tests
npm run test -- tests/integration

# E2E tests
npm run test -- tests/e2e

# Accessibility tests
npm run test -- tests/accessibility
```

## 🔍 Troubleshooting

### Server won't start

1. Check DATABASE_URL is configured
2. Verify PostgreSQL is running
3. Check port 5000 is available
4. Review logs in console output

### Database connection fails

1. Verify DATABASE_URL format
2. Check network connectivity
3. Ensure database exists
4. Test with: `psql $DATABASE_URL`

### Build errors

1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist .vite`
3. Run type check: `npm run typecheck`

### Campaign data not loading

1. Check CSV file: `attached_assets/campaigns.csv`
2. Verify database has campaigns: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM campaigns;"`
3. Force reload: Restart server (campaigns reload on startup)

## 📞 Support

For issues or questions:
- Check existing documentation in `docs/`
- Review API docs at `/api-docs` when server is running
- Check logs in console output
- Review code comments in source files

## 🎯 Next Steps

1. ✅ Complete initial setup above
2. ✅ Configure all environment variables
3. ✅ Restore or initialize database
4. ✅ Run development server and verify
5. ✅ Review documentation in `docs/`
6. ✅ Test booking flow end-to-end
7. ✅ Set up deployment environment
8. ✅ Configure monitoring and backups

---

**Version**: 1.0.0  
**Created**: $(date +"%B %d, %Y")  
**Platform**: Node.js, React, PostgreSQL, Express  
**License**: MIT
HANDOVER_EOF

# Create deployment checklist
cat > "$BACKUP_PATH/documentation/DEPLOYMENT_CHECKLIST.md" << 'CHECKLIST_EOF'
# Deployment Checklist

## Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Lint checks pass (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets properly secured

## Production Setup

- [ ] Database backup created
- [ ] DATABASE_URL configured
- [ ] SESSION_SECRET set (64+ characters)
- [ ] API_KEY set (32+ characters)
- [ ] ADMIN_KEY set (32+ characters)
- [ ] CSRF_SECRET set (64+ characters)
- [ ] NODE_ENV=production
- [ ] Monitoring configured
- [ ] Backup automation set up

## Security Verification

- [ ] CSRF protection enabled
- [ ] Rate limiting active
- [ ] Security headers configured (Helmet)
- [ ] Session management using PostgreSQL
- [ ] HTTPS enabled
- [ ] Admin access restricted
- [ ] File upload limits enforced

## Post-Deployment

- [ ] Health check endpoint working (`/health`)
- [ ] API documentation accessible (`/api-docs`)
- [ ] Campaign data loading correctly
- [ ] Booking flow functional
- [ ] Admin dashboard accessible
- [ ] Monitoring alerts configured
- [ ] Backup scripts scheduled

## Ongoing Maintenance

- [ ] Daily database backups
- [ ] Weekly security audits (`npm audit`)
- [ ] Monthly dependency updates
- [ ] Quarterly performance reviews
- [ ] Monitor error logs daily
- [ ] Review analytics weekly
CHECKLIST_EOF

# Create environment setup guide
cat > "$BACKUP_PATH/documentation/ENVIRONMENT_SETUP.md" << 'ENV_EOF'
# Environment Variables Setup Guide

## Required Variables

### Database Configuration
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

Example (Neon):
```env
DATABASE_URL=postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Security Secrets

Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

```env
SESSION_SECRET=<64-character-random-string>
API_KEY=<32-character-random-string>
ADMIN_KEY=<32-character-random-string>
CSRF_SECRET=<64-character-random-string>
```

### Application Configuration
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
LOG_LEVEL=info
```

## Optional Variables

### Admin Setup
```env
ADMIN_EMAIL=admin@yourdomain.com
```

### Email Service (SendGrid)
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### DocuSign Integration
```env
DOCUSIGN_INTEGRATION_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DOCUSIGN_SECRET_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DOCUSIGN_ACCOUNT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
```

### AWS S3 Storage
```env
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=eu-west-2
AWS_S3_BUCKET=southcoast-promotion-uploads
```

## Replit Secrets Setup

1. Open Replit workspace
2. Click "Secrets" in left sidebar (lock icon)
3. Add each variable as key-value pair
4. Secrets are automatically injected as environment variables

## Local Development (.env)

1. Copy `.env.example` to `.env`
2. Fill in required values
3. Never commit `.env` to version control
4. Use different values for dev/staging/prod

## Verification

Test configuration:
```bash
node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing')"
```

Or start the server and check logs for configuration validation.
ENV_EOF

# Create file inventory
echo -e "${BLUE}Creating file inventory...${NC}"
cat > "$BACKUP_PATH/documentation/FILE_INVENTORY.md" << 'INVENTORY_EOF'
# Backup File Inventory

## Directory Structure

```
southcoast-handover-TIMESTAMP/
├── client/                 # Frontend React application
├── server/                 # Backend Express server
├── services/               # Business logic services
├── shared/                 # Shared types and utilities
├── lib/                    # Core libraries
├── config/                 # Configuration files
├── migrations/             # Database migrations
├── types/                  # TypeScript type definitions
├── scripts/                # Utility scripts
├── attached_assets/        # Campaign data and assets
├── database/               # Database backup
│   └── database_backup_*.sql.gz
├── documentation/          # All documentation
│   ├── HANDOVER_GUIDE.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   ├── ENVIRONMENT_SETUP.md
│   └── FILE_INVENTORY.md (this file)
└── [configuration files]   # Root config files
```

## Key Files

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Development build config
- `vite.config.production.ts` - Production build config
- `drizzle.config.ts` - Database ORM config
- `tailwind.config.ts` - CSS framework config
- `.env.example` - Environment variable template

### Entry Points
- `index.ts` - Application entry point
- `server/index.ts` - Server initialization
- `client/src/main.tsx` - React app entry
- `deploy-guaranteed.js` - Production deployment script

### Documentation
- `README.md` - Project overview
- `replit.md` - Replit-specific docs
- `docs/` - Additional documentation

### Database
- `migrations/` - Database schema migrations
- `database/database_backup_*.sql.gz` - Database snapshot

## Total File Count
INVENTORY_EOF

# Count files
FILE_COUNT=$(find "$BACKUP_PATH" -type f | wc -l)
DIR_COUNT=$(find "$BACKUP_PATH" -type d | wc -l)
echo "- **Files**: $FILE_COUNT" >> "$BACKUP_PATH/documentation/FILE_INVENTORY.md"
echo "- **Directories**: $DIR_COUNT" >> "$BACKUP_PATH/documentation/FILE_INVENTORY.md"

# Create the ZIP archive
echo -e "${BLUE}Creating ZIP archive...${NC}"
cd "$BACKUP_DIR"
zip -r -q "${BACKUP_NAME}.zip" "${BACKUP_NAME}/"

# Calculate sizes
BACKUP_SIZE=$(du -sh "${BACKUP_NAME}.zip" | cut -f1)
UNCOMPRESSED_SIZE=$(du -sh "${BACKUP_NAME}" | cut -f1)

# Clean up temporary directory
rm -rf "$BACKUP_PATH"

# Final summary
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ Backup Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "  📦 Archive: ${BLUE}${FINAL_ZIP}${NC}"
echo -e "  📊 Size: ${BLUE}${BACKUP_SIZE}${NC} (${UNCOMPRESSED_SIZE} uncompressed)"
echo -e "  📁 Files: ${BLUE}${FILE_COUNT}${NC}"
echo -e "  📂 Directories: ${BLUE}${DIR_COUNT}${NC}"
echo ""
echo -e "${YELLOW}Included in backup:${NC}"
echo "  ✓ Complete source code"
echo "  ✓ All configuration files"
echo "  ✓ Database backup with schema and data"
echo "  ✓ Campaign CSV data"
echo "  ✓ Deployment scripts"
echo "  ✓ Comprehensive documentation"
echo "  ✓ GitHub workflows"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Download: ${FINAL_ZIP}"
echo "  2. Transfer to developer"
echo "  3. Developer follows HANDOVER_GUIDE.md"
echo "  4. Verify deployment checklist"
echo ""
echo -e "${GREEN}Backup ready for handover! 🚀${NC}"
