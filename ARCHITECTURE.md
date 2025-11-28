# Lifeline Architecture Documentation

## System Overview

Lifeline is a dual-sided mobile platform where **Creators** generate AI-powered biographies from their digital data, and **Consumers** discover and subscribe to compelling life stories.

## High-Level Architecture

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────┐
│   Backend API   │
│   (Node.js)     │
└────────┬────────┘
         │
    ┌────┼────┬──────────┬──────────┐
    │    │    │          │          │
    ▼    ▼    ▼          ▼          ▼
┌──────┐ │ ┌──────┐ ┌────────┐ ┌────────┐
│Postgres│ │OpenAI│ │ Stripe │ │  S3    │
│   DB   │ │  API │ │  API   │ │Storage │
└────────┘ └──────┘ └────────┘ └────────┘
           │
           ▼
     ┌──────────┬──────────┬─────────┐
     │Instagram │ Twitter  │ Gmail   │
     │   API    │   API    │  API    │
     └──────────┴──────────┴─────────┘
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 14+
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Express-validator
- **Security**: bcrypt, helmet, rate-limit

### Mobile
- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (tabs + stacks)
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **UI**: Expo Linear Gradient, custom components

### Third-Party Services
- **AI**: OpenAI GPT-4 Turbo
- **Payments**: Stripe
- **OAuth**: Instagram, Twitter/X, Facebook, LinkedIn, Gmail, Outlook
- **Storage**: AWS S3 or Google Cloud Storage
- **Monitoring**: Sentry (error tracking)
- **Analytics**: Mixpanel or Amplitude

## Database Schema

### Core Models

**User**
- Authentication (email, password, JWT tokens)
- Profile (name, bio, avatar)
- Role (Creator or Consumer)
- Verification status

**Biography**
- Title, description, cover image
- Status (Draft, Generating, Published)
- Metrics (views, subscriber count)
- Relationships to chapters and events

**Chapter**
- Ordered content (1, 2, 3...)
- Title, content (markdown/text)
- Time period (startDate, endDate)
- Word count, read time
- Relationships to events

**BiographyEvent**
- Timeline events (dates + titles)
- Categories (Life Event, Travel, Career, etc.)
- Source attribution (Instagram post, email, etc.)
- Location data

### Monetization Models

**Subscription**
- Subscriber ↔ Creator relationship
- Tier (Bronze, Silver, Gold, Platinum)
- Billing period (monthly)
- Stripe integration fields

**SubscriptionTier**
- Creator-customizable pricing
- Feature lists per tier
- Subscriber count tracking

**Transaction**
- Payment history
- Revenue split (80% creator, 20% platform)
- Stripe payment intent IDs

**CreatorEarnings**
- Total, pending, paid out amounts
- Payout tracking
- Stripe Connect account

### Data Integration Models

**DataSource**
- OAuth connections per user
- Access/refresh tokens (encrypted)
- Sync status and timestamps

**SocialPost**, **MediaItem**, **EmailMetadata**
- Aggregated data from connected sources
- Timestamped for chronological ordering
- Metadata for biography generation

## Authentication Flow

```
1. User Registration
   ├─ POST /api/auth/register
   ├─ Create user (password hashed with bcrypt)
   ├─ Generate email verification token
   └─ Send verification email

2. Email Verification
   ├─ GET /api/auth/verify-email/:token
   ├─ Mark user as verified
   └─ Redirect to app

3. Login
   ├─ POST /api/auth/login
   ├─ Verify password
   ├─ Generate access token (15min)
   ├─ Generate refresh token (7 days)
   └─ Return { accessToken, refreshToken, user }

4. Authenticated Requests
   ├─ Include: Authorization: Bearer <accessToken>
   ├─ Middleware verifies JWT
   └─ Attach user to request

5. Token Refresh
   ├─ POST /api/auth/refresh (with refreshToken)
   ├─ Verify refresh token from database
   ├─ Generate new access token
   └─ Return { accessToken }
```

## OAuth Flow

```
1. Initiate OAuth
   ├─ GET /api/oauth/:provider/initiate
   ├─ Generate state (CSRF token)
   ├─ Store state in memory/Redis
   └─ Redirect to provider authorization URL

2. OAuth Callback
   ├─ GET /api/oauth/:provider/callback?code=...&state=...
   ├─ Verify state matches
   ├─ Exchange code for access token
   ├─ Encrypt and store token
   ├─ Create DataSource record
   └─ Redirect to mobile app (deep link)

3. Data Sync (Background)
   ├─ Periodic job or manual trigger
   ├─ Fetch data from provider API
   ├─ Store in SocialPost/MediaItem/EmailMetadata
   └─ Update lastSyncAt
```

## Biography Generation Flow

```
1. User Initiates Generation
   ├─ POST /api/biography/generate
   ├─ Check minimum data points (10+)
   └─ Start async generation job

2. Data Aggregation
   ├─ Fetch all SocialPosts for user
   ├─ Fetch all MediaItems for user
   ├─ Fetch all Email Events for user
   └─ Sort chronologically

3. AI Biography Outline
   ├─ Call OpenAI API
   ├─ Provide data summary
   ├─ Receive 5-10 chapter structure
   └─ Create Chapter records

4. Chapter Content Generation
   ├─ For each chapter:
   │   ├─ Filter data for time period
   │   ├─ Call OpenAI API
   │   ├─ Generate 800-1500 word narrative
   │   └─ Save Chapter with content
   └─ Generate in sequence for context

5. Timeline Extraction
   ├─ Call OpenAI API
   ├─ Extract 10-20 key events
   └─ Create BiographyEvent records

6. Complete
   ├─ Update Biography status to DRAFT
   └─ Notify user
```

## Payment Flow

```
1. User Selects Tier
   ├─ View subscription plans
   ├─ Select tier (Bronze/Silver/Gold/Platinum)
   └─ Navigate to checkout

2. Payment Processing
   ├─ POST /api/payments/intent
   ├─ Create Stripe Payment Intent
   ├─ Return client secret
   └─ Mobile app collects payment

3. Payment Confirmation
   ├─ POST /api/payments/confirm
   ├─ Verify payment with Stripe
   ├─ Create Subscription record
   ├─ Create Transaction record
   ├─ Calculate revenue split (80/20)
   └─ Update CreatorEarnings

4. Access Granted
   ├─ Subscription is ACTIVE
   ├─ Paywall middleware allows access
   └─ User can view biography
```

## Access Control (Paywall)

```
Middleware: requireSubscription(creatorId, minTier?)

1. Extract JWT from request
2. Get userId from token
3. Check Subscription for (userId, creatorId)
4. Verify status is ACTIVE
5. Verify not expired
6. If minTier specified, check tier hierarchy
7. Allow/deny access
   ├─ 401: Not authenticated
   ├─ 402: Subscription required
   ├─ 403: Insufficient tier
   └─ 200: Access granted
```

## Security Measures

### Implemented
✅ Password hashing (bcrypt, 12 rounds)
✅ JWT authentication with short expiration
✅ Refresh token rotation
✅ Email verification
✅ Rate limiting (auth endpoints)
✅ CORS configuration
✅ OAuth token encryption (AES-256-CBC)
✅ SQL injection prevention (Prisma ORM)
✅ Input validation

### Recommended Additions
⚠️ Security headers (helmet.js)
⚠️ Request validation schemas (Zod/Joi)
⚠️ HTTPS enforcement in production
⚠️ Dependency scanning (Snyk/npm audit)
⚠️ API rate limiting (Redis-backed)
⚠️ Content Security Policy
⚠️ Penetration testing

## Scaling Considerations

### Database
- Read replicas for biography viewing
- Indexes on frequently queried fields
- Partitioning for large tables (transactions)
- Connection pooling

### Caching
- Redis for session storage
- Cache subscription status (5 min TTL)
- Cache biography content (1 hour TTL)
- Invalidate on updates

### API
- Load balancer (nginx, AWS ALB)
- Horizontal scaling (stateless design)
- Background jobs (Bull/BullMQ)
- CDN for static assets

### Monitoring
- Error tracking (Sentry)
- Performance monitoring (New Relic/DataDog)
- Log aggregation (CloudWatch/Papertrail)
- Uptime monitoring (UptimeRobot)

## Development Workflow

```
1. Local Development
   ├─ docker-compose up (PostgreSQL + Redis)
   ├─ npm run dev (backend)
   └─ npm start (mobile)

2. Feature Development
   ├─ Create feature branch
   ├─ Write code + tests
   ├─ Run linter + tests
   └─ Create PR

3. CI/CD
   ├─ GitHub Actions run tests
   ├─ Check code coverage (70%+)
   ├─ Deploy to staging (auto)
   └─ Deploy to production (manual approval)
```

## Deployment Architecture

```
Production Environment:

┌─────────────────┐
│   CloudFlare    │ (CDN, DDoS protection)
└────────┬────────┘
         │
┌─────────▼────────┐
│  Load Balancer   │ (AWS ALB / nginx)
└────────┬─────────┘
         │
    ┌────┴────┬────────┐
    ▼         ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Backend  │ │Backend  │ │Backend  │
│Instance1│ │Instance2│ │Instance3│
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     └───────────┴───────────┘
                 │
         ┌───────┴────────┬─────────┐
         ▼                ▼         ▼
    ┌────────┐      ┌──────────┐ ┌─────┐
    │Postgres│      │  Redis   │ │ S3  │
    │  RDS   │      │ (Cache)  │ │     │
    └────────┘      └──────────┘ └─────┘
```

## Cost Estimates (Monthly)

**Infrastructure:**
- Backend hosting: $20-50 (small instances)
- PostgreSQL: $15-30 (managed database)
- Redis: $10-20 (managed cache)
- S3 storage: $5-15 (per GB)

**Third-Party:**
- OpenAI API: $50-200 (based on usage)
- Stripe fees: 2.9% + $0.30 per transaction
- Sentry: $0-26 (free tier available)

**Total Estimate**: $100-350/month for small scale

## Summary

Lifeline uses a modern, scalable architecture with:
- Monorepo structure (backend + mobile)
- Microservices-ready design
- AI-powered content generation
- Multi-tier subscription system
- Secure OAuth integrations
- Revenue sharing model
- Comprehensive monitoring

The system is designed for reliability, security, and scalability from day one.
