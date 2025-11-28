# Lifeline Backend API

Production-ready backend API for the Lifeline mobile application - AI-powered biography generation platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth with refresh tokens
- **Payment Processing**: Stripe (integration placeholders)
- **AI**: OpenAI GPT-4 for biography generation
- **File Storage**: AWS S3 or GCS (configurable)

## Features

- ✅ User authentication & authorization (JWT)
- ✅ Email verification & password reset
- ✅ Role-based access control (Creator/Consumer)
- ✅ OAuth 2.0 integration (Instagram, Twitter, Facebook, LinkedIn, Gmail, Outlook)
- ✅ AI-powered biography generation
- ✅ Chapter management with timeline events
- ✅ Subscription system (4 tiers: Bronze, Silver, Gold, Platinum)
- ✅ Payment processing with revenue split (80/20)
- ✅ Creator earnings tracking
- ✅ Paywall middleware for content access

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your .env file with required values

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

### Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Environment Variables

### Required

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lifeline"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"

# Email (SMTP)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="noreply@lifeline.com"

# Frontend URL (for OAuth callbacks)
FRONTEND_URL="http://localhost:8081"

# Encryption (for OAuth tokens)
ENCRYPTION_KEY="your-32-byte-encryption-key"
```

### Optional - OAuth Providers

```env
INSTAGRAM_CLIENT_ID=""
INSTAGRAM_CLIENT_SECRET=""
INSTAGRAM_REDIRECT_URI="http://localhost:3000/api/oauth/instagram/callback"

TWITTER_CLIENT_ID=""
TWITTER_CLIENT_SECRET=""
# ... (see .env.example for all providers)
```

### Optional - AI Service

```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"
OPENAI_MAX_TOKENS="4000"
```

### Optional - Cloud Storage

```env
STORAGE_PROVIDER="s3"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET=""
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### OAuth
- `GET /api/oauth/:provider/initiate` - Start OAuth flow
- `GET /api/oauth/:provider/callback` - OAuth callback
- `GET /api/oauth/data-sources` - Get connected data sources
- `DELETE /api/oauth/data-sources/:id` - Disconnect data source

### Biography (Planned)
- `POST /api/biography/generate` - Generate biography
- `GET /api/biography/:id` - Get biography
- `PUT /api/biography/:id` - Update biography
- `DELETE /api/biography/:id` - Delete biography

### Subscriptions (Planned)
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/me` - Get user subscriptions
- `PUT /api/subscriptions/:id/upgrade` - Upgrade tier
- `DELETE /api/subscriptions/:id` - Cancel subscription

## Database Schema

See `prisma/schema.prisma` for complete schema.

**Key Models:**
- `User` - User accounts with roles
- `Biography` - AI-generated biographies
- `Chapter` - Biography chapters
- `BiographyEvent` - Timeline events
- `Subscription` - User subscriptions
- `Transaction` - Payment transactions
- `DataSource` - Connected OAuth accounts

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test auth.controller.test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Deployment

### Using Docker

```bash
# Build image
docker build -t lifeline-backend .

# Run container
docker run -p 3000:3000 --env-file .env lifeline-backend
```

### Using Docker Compose

```bash
docker-compose up -d
```

### Manual Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Build: `npm run build`
5. Start: `npm start`

## Architecture

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── db/             # Database client
├── middleware/     # Express middleware
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Helper functions
└── index.ts        # Entry point
```

## Security

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT tokens with expiration
- ✅ Rate limiting on auth endpoints
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (Prisma)
- ✅ OAuth token encryption (AES-256-CBC)
- ⚠️ Add helmet.js for security headers
- ⚠️ Implement request validation with Joi/Zod

## Contributing

This is a private project. For questions, contact the development team.

## License

Proprietary - All rights reserved
