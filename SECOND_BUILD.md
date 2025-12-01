# SECOND_BUILD.md - Phase 2: Network Effects & Viral Growth

## Executive Summary

This document outlines the implementation strategy for transforming Lifeline from a monetized biography platform into a viral social memory network with enterprise-grade features. The enhanced PRD introduces 20+ major feature categories that will create Facebook-level network effects while maintaining our existing monetization foundation.

**Timeline**: 6-9 months (8 major phases)
**Estimated Team**: 3-5 engineers + 1 AI/ML specialist
**Total Features**: 60+ new capabilities
**Primary Goal**: Build irreplaceable network effects that prevent user churn

---

## Current State Analysis

### What We've Built (Phase 1.4 + 1.5)

**Backend (Phase 1.4):**
- ✅ Subscription system (tiers, payments, payouts)
- ✅ PayPal integration (Stripe ready)
- ✅ Chapter-level access control
- ✅ Revenue tracking and analytics
- ✅ Content access service
- ✅ 40/60 revenue split logic

**Frontend (Phase 1.5):**
- ✅ Next.js 14 app (TypeScript + Tailwind)
- ✅ Authentication system
- ✅ Creator Dashboard with charts
- ✅ Biography Editor (Tiptap)
- ✅ Monetization UI
- ✅ Public profiles and reader
- ✅ Paywall components

**Gaps to Address:**
- ❌ No network effects between users
- ❌ No viral growth mechanics
- ❌ No daily engagement hooks
- ❌ Limited AI capabilities (no predictions, patterns, coaching)
- ❌ No location tracking
- ❌ No audio/voice features
- ❌ No content protection
- ❌ No enterprise features

---

## Strategic Priorities

### Critical Path Features (Build First)
1. **Memory Graph** - Creates network lock-in
2. **"I Was There" Tagging** - Viral invitation loop
3. **Living Chapters** - Daily engagement habit
4. **Story Snippets** - Social media virality

### High-Value Monetization (Build Second)
5. **Shadow Self** - Premium tier justification
6. **Vault Mode** - Ultra-premium ($100-500/month)
7. **Collaborative Marketplace** - Transaction fees

### Retention & Engagement (Build Third)
8. **Rewind Feature** - Addictive UI
9. **AI Life Coach** - Value-add for subscribers
10. **Prediction Engine** - Unique selling point

---

## Phase 2.1: Network Effects Foundation (Weeks 1-6)

**Goal**: Create the Memory Graph that makes Lifeline irreplaceable.

### Database Schema Extensions

**New Models**:
```prisma
model Connection {
  id              String   @id @default(uuid())
  userAId         String
  userBId         String
  userA           User     @relation("ConnectionsAsA", fields: [userAId], references: [id])
  userB           User     @relation("ConnectionsAsB", fields: [userBId], references: [id])
  strengthScore   Float    // 0-100 based on shared experiences
  relationshipType String  // friend, family, colleague, romantic
  startDate       DateTime?
  endDate         DateTime?
  timeline        Json     // Relationship evolution data
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([userAId, userBId])
}

model MemoryCollision {
  id          String   @id @default(uuid())
  eventId     String   // Reference to BiographyEvent
  users       String[] // Array of user IDs present
  location    String?
  timestamp   DateTime
  confidence  Float    // AI confidence in match
  verified    Boolean  @default(false)
  perspectives Json    // Different user perspectives
  createdAt   DateTime @default(now())
}

model EventTag {
  id            String   @id @default(uuid())
  eventId       String
  taggerId      String
  tagger        User     @relation("Tagger", fields: [taggerId], references: [id])
  taggedUserId  String
  taggedUser    User     @relation("Tagged", fields: [taggedUserId], references: [id])
  status        String   // pending, accepted, declined
  message       String?  // "You were there!"
  verificationData Json? // Photos, details added by tagged user
  createdAt     DateTime @default(now())
  
  @@index([taggedUserId, status])
}

model StoryMerger {
  id          String   @id @default(uuid())
  eventId     String
  participants String[] // User IDs
  mergedContent Json   // Combined narrative
  revenueShare Json    // Split percentages
  isPublished Boolean  @default(false)
  price       Float?
  salesCount  Int      @default(0)
  createdAt   DateTime @default(now())
}
```

### Week 1-2: Memory Graph Backend

**Tasks**:
- [ ] Create Connection and MemoryCollision models
- [ ] Implement AI collision detection service
  - Temporal overlap detection (same date/time)
  - Spatial overlap detection (same location within 50m radius)
  - Mutual mention detection (mentions in posts/diary)
- [ ] Build relationship timeline generator
- [ ] Create Connection Strength Calculator
  - Frequency of shared experiences
  - Recency of interactions
  - Mutual friend count
  - Engagement with each other's content

**API Endpoints**:
```typescript
POST   /api/connections/detect          // Run collision detection
GET    /api/connections/graph/:userId   // Get user's Memory Graph
GET    /api/connections/timeline/:connectionId // Relationship timeline
POST   /api/connections/strengthen      // Manual connection confirmation
GET    /api/connections/suggestions     // AI-suggested connections
```

### Week 3-4: "I Was There" Tagging System

**Backend**:
- [ ] Create EventTag model and service
- [ ] Implement tagging workflow
  - Creator tags friend in event
  - System sends notification/email to tagged user
  - Tagged user must join to verify
- [ ] Build tag verification rewards
- [ ] Create "Memory Completeness Score" calculator

**Frontend**:
- [ ] Tag interface in editor (mention-style @tagging)
- [ ] Tag notification system
- [ ] Tag verification flow for new users
- [ ] "Pending Tags" management page
- [ ] Memory Completeness Score widget

**Viral Loop**:
```
Creator tags friend → Friend gets email →
"John tagged you in 'Road Trip 2019'" →
Must join Lifeline to verify →
Friend adds their perspective →
Their story gains value from being tagged →
They tag more friends → Loop continues
```

### Week 5-6: Story Mergers

**Backend**:
- [ ] Create StoryMerger model
- [ ] Implement merger generation service
  - Detect overlapping events
  - Auto-generate split-screen narrative
  - Calculate revenue share
- [ ] Build merger approval workflow
- [ ] Implement cross-subscription validation

**Frontend**:
- [ ] Split-screen merger reader UI
- [ ] Merger creation wizard
- [ ] Revenue share agreement interface
- [ ] Merged chapter marketplace

**Monetization**:
- Platform takes 30% of merger transactions
- Remaining 70% split between creators (customizable)

---

## Phase 2.2: Engagement & Retention (Weeks 7-12)

**Goal**: Build daily habits and addictive features.

### Week 7-9: Living Chapters

**Database**:
```prisma
model LivingChapter {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  title           String
  content         String   @db.Text
  status          String   // draft, active, completed
  startDate       DateTime
  endDate         DateTime?
  completionTrigger String? // AI-detected event
  subscriberCount Int      @default(0)
  viewCount       Int      @default(0)
  releaseSchedule Json?    // For episodic releases
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model LivingFeedEntry {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  content   String   @db.Text
  mood      String?
  location  String?
  mediaUrls String[]
  isPublic  Boolean  @default(true)
  timestamp DateTime @default(now())
  
  @@index([userId, timestamp])
}
```

**Backend**:
- [ ] Implement Chapter Completion Detection AI
  - Job change indicators
  - Location change (moving)
  - Relationship milestones
  - Project completion signals
- [ ] Build Living Feed aggregation service
- [ ] Create notification system for chapter releases
- [ ] Implement episodic release scheduler

**Frontend**:
- [ ] Living Feed widget (Instagram Stories style)
- [ ] Chapter release notifications UI
- [ ] "New Chapter" badges
- [ ] Binge mode interface
- [ ] Chapter analytics dashboard for creators

### Week 10-12: Rewind Feature

**Frontend (Primary Focus)**:
- [ ] Vertical swipe interface (TikTok-style)
- [ ] Timeline scrubber component
- [ ] Day-by-day content carousel
- [ ] Location map integration
- [ ] Mood indicator visualization
- [ ] "On This Day" notifications
- [ ] Random Memory feature
- [ ] Comparison mode (year-over-year)

**Backend**:
- [ ] Efficient day-by-day data retrieval
- [ ] Content caching for smooth scrolling
- [ ] Usage analytics (which periods users explore most)

**Daily Engagement Hook**:
- Push notification: "See what Sarah was doing on this day in 2020"
- Random memory on app open
- Streak tracking for daily opens

---

## Phase 2.3: Premium Tiers & Advanced Monetization (Weeks 13-18)

**Goal**: Justify $100-500/month pricing with exclusive features.

### Week 13-15: Shadow Self Analysis

**Database**:
```prisma
model ShadowSelfAnalysis {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  eventId       String
  publicPost    Json     // What was posted
  privateReality Json    // Diary entry, deleted content
  aiAnalysis    String   @db.Text
  sentiment     Json     // Mood differences
  accessTier    String   @default("platinum")
  createdAt     DateTime @default(now())
}

model DeletedContent {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  platform      String
  originalContent String @db.Text
  deletedAt     DateTime
  reason        String?
  editHistory   Json?    // Track edits
  recovered     Boolean  @default(false)
}
```

**Backend**:
- [ ] Deleted content tracking service
  - Monitor social media APIs for deletions
  - Archive deleted posts/edited captions
- [ ] Shadow Self AI analysis
  - Compare public vs private content
  - Generate "What I Posted vs What Really Happened"
  - Sentiment divergence detection
- [ ] Access control enforcement (Platinum tier only)

**Frontend**:
- [ ] Shadow Self viewer (side-by-side comparison)
- [ ] Deleted content archive browser
- [ ] Privacy controls for Shadow Self
- [ ] "Persona Gap" visualization charts

### Week 16-18: Vault Mode

**Database**:
```prisma
model VaultContent {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  content         String   @db.Text
  contentType     String   // diary, photo, video, document
  watermarkId     String   // Unique per subscriber
  ndaRequired     Boolean  @default(true)
  encryptionKey   String   // For end-to-end encryption
  createdAt       DateTime @default(now())
}

model VaultAccess {
  id              String   @id @default(uuid())
  subscriberId    String
  subscriber      User     @relation("VaultSubscriber", fields: [subscriberId], references: [id])
  creatorId       String
  creator         User     @relation("VaultCreator", fields: [creatorId], references: [id])
  ndaSigned       Boolean  @default(false)
  ndaSignedAt     DateTime?
  ndaDocument     String?  // Signed PDF
  biometricVerified Boolean @default(false)
  accessLog       Json[]   // Audit trail
  screenshotWarnings Int   @default(0)
  isBanned        Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

**Backend**:
- [ ] End-to-end encryption service
- [ ] Dynamic watermarking system
  - Unique watermark per subscriber
  - Invisible forensic watermarks
- [ ] NDA generation and signing
- [ ] Biometric verification API
- [ ] Access audit logging
- [ ] Screenshot detection (mobile SDK)

**Frontend**:
- [ ] Vault Mode UI (separate section)
- [ ] Biometric authentication flow
- [ ] NDA signing interface
- [ ] Screenshot detection alerts
- [ ] Access log viewer (creator-side)

**Legal**:
- [ ] NDA template (reviewed by legal counsel)
- [ ] Terms of Service updates
- [ ] Penalty clause implementation

---

## Phase 2.4: Viral Growth Mechanics (Weeks 19-24)

**Goal**: Turn users into acquisition channels.

### Week 19-21: Story Snippets

**Backend**:
- [ ] Video generation service (FFmpeg, Remotion)
- [ ] AI highlight extraction
  - Identify most emotional moments
  - Find compelling narrative arcs
  - Select best photos/videos
- [ ] Template rendering engine
- [ ] Social media posting API integration

**Frontend**:
- [ ] Snippet preview and editing
- [ ] Template selection gallery
- [ ] Music library integration
- [ ] Platform-specific exports
- [ ] Share tracking dashboard

**Templates**:
- Cinematic (Ken Burns effect)
- Documentary (interview style)
- Animated (motion graphics)
- Minimal (quote + image)

### Week 22-23: Referral Program

**Database**:
```prisma
model ReferralCode {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  code        String   @unique
  used        Int      @default(0)
  earnings    Float    @default(0)
  createdAt   DateTime @default(now())
}

model Referral {
  id          String   @id @default(uuid())
  referrerId  String
  referrer    User     @relation("Referrer", fields: [referrerId], references: [id])
  refereeId   String
  referee     User     @relation("Referee", fields: [refereeId], references: [id])
  code        String
  status      String   // pending, completed
  reward      Float
  createdAt   DateTime @default(now())
}
```

**Backend**:
- [ ] Referral code generation
- [ ] Tracking and attribution
- [ ] Reward calculation (1 month free + 10% revenue)
- [ ] Leaderboard service

**Frontend**:
- [ ] Referral dashboard
- [ ] Custom code creation
- [ ] Share link generator
- [ ] Leaderboard UI
- [ ] Reward redemption

### Week 24: Before I Die Mode

**Database**:
```prisma
model BeforeIDieContent {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  content         String   @db.Text
  releaseDate     DateTime?
  triggers        Json     // Dead man's switch config
  trusteeEmail    String?
  trusteeName     String?
  status          String   // active, released, cancelled
  lastCheckIn     DateTime
  checkInFrequency String  // daily, weekly, monthly
  createdAt       DateTime @default(now())
}
```

**Backend**:
- [ ] Dead man's switch service
- [ ] Check-in reminder system
- [ ] Trustee notification workflow
- [ ] Posthumous content release
- [ ] Final Chapter auto-generation

**Frontend**:
- [ ] Before I Die content editor
- [ ] Check-in dashboard
- [ ] Trustee management
- [ ] Release trigger configuration

---

## Phase 2.5: AI Enhancement (Weeks 25-30)

**Goal**: Differentiate with advanced AI that provides unique value.

### Week 25-27: Pattern Recognition & Prediction Engine

**Backend AI Services**:
```typescript
// Pattern Recognition
class PatternRecognitionService {
  detectProductivityCycles(userId: string)
  identifyRelationshipPatterns(userId: string)
  findDecisionMakingTendencies(userId: string)
  detectStressTriggers(userId: string)
  predictJobChanges(userId: string)
  calculateRelationshipHealthScore(userId: string, connectionId: string)
}

// Life Coach
class LifeCoachService {
  generateInsights(userId: string, pattern: Pattern)
  answerQuestion(query: string, userId: string)
  findSimilarExperiences(scenario: string, userId: string)
  suggestActions(pattern: Pattern)
}

// Prediction Engine
class PredictionEngine {
  predictEvent(userId: string, eventType: string)
  calculateConfidence(prediction: Prediction)
  generateExplanation(prediction: Prediction)
}
```

**Database**:
```prisma
model Pattern {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        String   // productivity, relationship, decision
  description String   @db.Text
  frequency   String   // daily, weekly, seasonal
  confidence  Float
  examples    Json     // Historical instances
  createdAt   DateTime @default(now())
}

model Prediction {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  eventType   String   // job_change, relationship_end, etc.
  likelihood  Float    // 0-100
  reasoning   String   @db.Text
  historicalBasis Json
  isVisible   Boolean  @default(false) // Creator control
  createdAt   DateTime @default(now())
}
```

**Implementation**:
- [ ] Time-series analysis on user data
- [ ] Pattern detection algorithms
  - Job change signals (LinkedIn activity + sentiment)
  - Relationship health (communication frequency + sentiment)
  - Productivity cycles (activity patterns)
- [ ] Prediction model training
  - Historical data → Future likelihood
  - Confidence scoring
- [ ] Life Coach query engine
  - Natural language processing
  - Context-aware responses from biography

**Frontend**:
- [ ] Pattern visualization charts
- [ ] Prediction dashboard
- [ ] Life Coach chat interface
- [ ] Insight cards (swipeable)

### Week 28-30: Audio Interrogator

**Database**:
```prisma
model AudioDiaryEntry {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  audioUrl      String
  transcription String   @db.Text
  voiceTone     Json     // Emotion analysis
  duration      Int      // Seconds
  questions     Json     // AI questions asked
  responses     Json     // User responses
  createdAt     DateTime @default(now())
}
```

**Backend**:
- [ ] Speech-to-text service (Google Cloud Speech-to-Text)
- [ ] Text-to-speech service (for AI questions)
- [ ] Contextual question generation
  - Based on recent events
  - Based on mood/sentiment
  - Based on location
- [ ] Voice tone analysis
- [ ] Audio storage and playback

**Frontend (Mobile Priority)**:
- [ ] Voice recording interface
- [ ] AI interrogation flow
  - AI asks question (TTS)
  - User responds (STT)
  - AI asks follow-up
- [ ] Audio diary entry player
- [ ] Transcription viewer

---

## Phase 2.6: Privacy & Security (Weeks 31-36)

**Goal**: Build trust with enterprise-grade security.

### Week 31-33: Zero-Knowledge Email Scan

**Architecture**:
```
User's Device (Client-Side)
  ↓
  [Email Scan Service] ← Local processing only
  ↓
  Extract metadata only (dates, locations, event confirmations)
  ↓
  Encrypted metadata sent to server
  ↓
Server (Lifeline Backend)
  ↓
  Decrypts metadata (not email bodies)
  ↓
  Stores structured data only
```

**Implementation**:
- [ ] Client-side email processing library
  - OAuth token handling
  - Local email parsing
  - Metadata extraction (dates, locations, names)
- [ ] End-to-end encryption
- [ ] Server-side metadata storage
- [ ] Transparency dashboard

**Frontend**:
- [ ] Email connection with privacy explanation
- [ ] "What we see vs don't see" visualization
- [ ] Transparency dashboard showing extracted data
- [ ] Manual control over which emails to process

### Week 34-36: Content Protection

**Database**:
```prisma
model Watermark {
  id            String   @id @default(uuid())
  contentId     String
  subscriberId  String
  watermarkData String   // Unique identifier
  type          String   // visible, invisible, forensic
  createdAt     DateTime @default(now())
}

model ScreenshotDetection {
  id            String   @id @default(uuid())
  subscriberId  String
  subscriber    User     @relation(fields: [subscriberId], references: [id])
  creatorId     String
  contentId     String
  detectedAt    DateTime @default(now())
  warningIssued Boolean  @default(true)
}

model ContentHash {
  id          String   @id @default(uuid())
  contentId   String
  hash        String   @unique
  blockchain  String?  // Ethereum/Polygon transaction ID
  timestamp   DateTime @default(now())
}
```

**Watermarking**:
- [ ] Server-side image watermarking (Sharp)
- [ ] Video watermarking (FFmpeg)
- [ ] Dynamic watermark generation (unique per subscriber)
- [ ] Forensic watermark embedding

**Screenshot Detection**:
- [ ] Mobile SDK integration (iOS/Android)
- [ ] Web API listeners
- [ ] Real-time notifications
- [ ] Three-strike enforcement

**Blockchain Authentication**:
- [ ] Content hashing service (SHA-256)
- [ ] Blockchain storage (Polygon for low fees)
- [ ] Public verification API
- [ ] Trust badge generation

**Frontend**:
- [ ] Watermark preview (creator settings)
- [ ] Screenshot alert notifications
- [ ] Verification tool (check content authenticity)
- [ ] Trust badge display

---

## Phase 2.7: Location & Context (Weeks 37-42)

### Week 37-39: Live Maps Integration

**Database**:
```prisma
model LocationHistory {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  latitude    Float
  longitude   Float
  accuracy    Float
  timestamp   DateTime
  dwellTime   Int?     // Minutes at location
  placeName   String?
  placeType   String?  // home, work, restaurant, etc.
  isSignificant Boolean @default(false)
  
  @@index([userId, timestamp])
}

model PrivacyZone {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  latitude    Float
  longitude   Float
  radius      Int      // Meters
  name        String   // "Home", "Work", etc.
  trackingDisabled Boolean @default(true)
}
```

**Implementation**:
- [ ] Google Maps SDK integration
- [ ] Location tracking service (background)
- [ ] Significant location detection
  - Dwell time threshold (>30 minutes)
  - New location detection
- [ ] Place identification (Google Places API)
- [ ] Privacy zones (blacklist locations)

**Frontend**:
- [ ] Map timeline viewer
- [ ] Location interrogation prompts
- [ ] Privacy zone configuration
- [ ] Geospatial history visualization
- [ ] Heatmap of visited locations

### Week 40-42: Location-Based Interrogation

**Database**:
```prisma
model LocationPrompt {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  locationId  String
  question    String
  response    String?  @db.Text
  photos      String[] // URLs
  audioUrl    String?
  answered    Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

**Backend**:
- [ ] Geofencing triggers
- [ ] Context-aware question generation
  - "First time at this location?"
  - "Who are you with?"
  - "Why are you here?"
- [ ] Location enrichment pipeline
- [ ] Photo/audio attachment handling

**Mobile**:
- [ ] Push notification on significant stops
- [ ] Quick-response interface
- [ ] Photo capture prompt
- [ ] Audio response option
- [ ] Skip/snooze options

---

## Phase 2.8: Enterprise & B2B (Weeks 43-48)

**Goal**: $10k-500k annual contracts.

### Corporate Biography Service

**Database**:
```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String
  type        String   // company, team, nonprofit, sports_team
  admins      User[]   @relation("OrgAdmin")
  members     User[]   @relation("OrgMember")
  timeline    Json
  plan        String   // starter, professional, enterprise
  maxUsers    Int
  billingEmail String
  createdAt   DateTime @default(now())
}

model OrganizationTimeline {
  id            String   @id @default(uuid())
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id])
  eventType     String   // milestone, product_launch, funding, crisis
  title         String
  description   String   @db.Text
  date          DateTime
  participants  String[] // User IDs
  media         String[]
  createdAt     DateTime @default(now())
}
```

**Features**:
- [ ] Multi-user accounts
- [ ] Role-based permissions (admin, editor, viewer)
- [ ] Company timeline generation
- [ ] Team collaboration tools
- [ ] Brand narrative AI
- [ ] Culture sentiment analysis
- [ ] Recruitment content generation

**Frontend**:
- [ ] Organization dashboard
- [ ] Team member management
- [ ] Company timeline editor
- [ ] Brand narrative preview
- [ ] Export tools (for marketing)

**Pricing**:
- Starter: $10k/year (up to 50 users)
- Professional: $50k/year (up to 200 users)
- Enterprise: Custom pricing (unlimited)

---

## Technical Integration Plan

### Database Migrations Strategy
```bash
# Sequential migrations to avoid conflicts
1. Phase 2.1: Add Connection, MemoryCollision, EventTag, StoryMerger
2. Phase 2.2: Add LivingChapter, LivingFeedEntry
3. Phase 2.3: Add ShadowSelfAnalysis, DeletedContent, VaultContent, VaultAccess
4. Phase 2.4: Add ReferralCode, Referral, BeforeIDieContent
5. Phase 2.5: Add Pattern, Prediction, AudioDiaryEntry
6. Phase 2.6: Add Watermark, ScreenshotDetection, ContentHash
7. Phase 2.7: Add LocationHistory, PrivacyZone, LocationPrompt
8. Phase 2.8: Add Organization, OrganizationTimeline

# Update User model with new fields
- shadowSelfEnabled: Boolean
- vaultModeEnabled: Boolean
- locationTrackingEnabled: Boolean
- memoryCompletenessScore: Float
```

### API Versioning
```typescript
// Maintain backward compatibility
/api/v1/*  // Existing endpoints (Phase 1.4)
/api/v2/*  // New network effects features (Phase 2)

// Version negotiation in headers
X-API-Version: 2.0
```

### Frontend Architecture
```
frontend/
├── src/
│   ├── app/
│   │   ├── (existing pages)
│   │   ├── memory-graph/      // Phase 2.1
│   │   ├── rewind/             // Phase 2.2
│   │   ├── vault/              // Phase 2.3
│   │   ├── marketplace/        // Phase 2.4
│   │   ├── life-coach/         // Phase 2.5
│   │   └── enterprise/         // Phase 2.8
│   ├── components/
│   │   ├── network/            // Memory Graph components
│   │   ├── viral/              // Sharing, snippets
│   │   ├── ai/                 // AI coach, predictions
│   │   └── security/           // Vault, watermarks
```

### Backend Services Organization
```
backend/
├── src/
│   ├── services/
│   │   ├── network/
│   │   │   ├── connection.service.ts
│   │   │   ├── collision-detection.service.ts
│   │   │   └── memory-graph.service.ts
│   │   ├── ai/
│   │   │   ├── pattern-recognition.service.ts
│   │   │   ├── prediction.service.ts
│   │   │   └── life-coach.service.ts
│   │   ├── security/
│   │   │   ├── watermark.service.ts
│   │   │   ├── encryption.service.ts
│   │   │   └── blockchain.service.ts
│   │   └── location/
│   │       ├── tracking.service.ts
│   │       └── interrogation.service.ts
```

---

## Success Metrics

### Network Effects (Phase 2.1)
- **Memory Collisions**: Target 5+ per active user
- **Tag Acceptance Rate**: >60% of tags accepted
- **Connection Strength**: Average score >50
- **Story Merger Creation**: 10% of users create mergers

### Engagement (Phase 2.2)
- **DAU/MAU Ratio**: >40% (sticky app)
- **Living Feed Checks**: 3+ times per week
- **Rewind Sessions**: Average 10+ minutes per session
- **Chapter Notification Open Rate**: >50%

### Monetization (Phase 2.3)
- **Platinum Tier Conversion**: 5% of paid subscribers
- **Vault Mode Subscribers**: 2% of total users
- **Average Vault ARPU**: $200/month
- **Shadow Self Engagement**: 80% of Platinum users access monthly

### Viral Growth (Phase 2.4)
- **Story Snippet Shares**: 2+ per creator per month
- **Referral Conversion**: 30% of referred users sign up
- **Referral-to-Paid**: 15% of referred users become subscribers
- **K-Factor**: >1.2 (viral growth)

### Enterprise (Phase 2.8)
- **Enterprise Contracts**: 50+ in year 1
- **Average Contract Value**: $50k
- **Enterprise Revenue**: 20% of total revenue

---

## Risk Mitigation

### Technical Risks

**AI Costs**:
- **Risk**: OpenAI API usage will scale exponentially
- **Mitigation**:
  - Cache AI results aggressively
  - Batch processing for pattern detection
  - Set per-user cost limits
  - Consider fine-tuned models (cheaper than GPT-4)

**Storage Costs**:
- **Risk**: Media storage will grow rapidly
- **Mitigation**:
  - Tiered storage (hot/cold)
  - Aggressive compression
  - CDN for delivery
  - User quotas based on subscription tier

**Real-time Performance**:
- **Risk**: Memory Graph calculations too slow
- **Mitigation**:
  - Background job processing
  - Redis caching
  - Incremental updates (not full recalculation)
  - Graph database (Neo4j) for complex queries

**Mobile Battery**:
- **Risk**: Location tracking drains battery
- **Mitigation**:
  - Significant changes only (not continuous)
  - Geofencing for efficiency
  - User control over tracking frequency

### Legal Risks

**NDA Enforceability**:
- **Risk**: Vault Mode NDAs may not hold up in court
- **Mitigation**:
  - Legal counsel review
  - Clear penalty clauses
  - Case law research
  - Insurance for lawsuit costs

**Screenshot Detection**:
- **Risk**: May not work on all devices/browsers
- **Mitigation**:
  - Clear warnings upfront
  - Watermarking as backup
  - Three-strike policy
  - Accept some leakage as inevitable

**Deleted Content**:
- **Risk**: Platforms may ban API access for tracking deletions
- **Mitigation**:
  - User consent prominently displayed
  - Comply with platform ToS
  - Alternative: Ask users to manually submit deleted content
  - Legal review of data retention policies

**GDPR/Privacy**:
- **Risk**: Location tracking, Shadow Self may violate privacy laws
- **Mitigation**:
  - Opt-in by default
  - Clear consent flows
  - Data portability
  - Right to be forgotten
  - EU data residency

### Product Risks

**Feature Overload**:
- **Risk**: Too many features confusing users
- **Mitigation**:
  - Phased rollout
  - Progressive disclosure
  - User education (tutorials)
  - Feature gating by subscription tier

**Privacy Backlash**:
- **Risk**: Users uncomfortable with tracking/AI analysis
- **Mitigation**:
  - Transparency first
  - Granular privacy controls
  - Zero-knowledge architecture
  - Clear value proposition

**AI Accuracy**:
- **Risk**: Pattern recognition/predictions are wrong
- **Mitigation**:
  - Confidence scores displayed
  - "This is AI-generated" disclaimers
  - User feedback loops
  - Conservative predictions

**Viral Growth Fails**:
- **Risk**: "I Was There" tagging doesn't drive growth
- **Mitigation**:
  - Test with focus groups
  - A/B test messaging
  - Incentivize with rewards
  - Simplify onboarding for tagged users

---

## Recommended Build Order

**Months 1-2**: Network Effects (Phase 2.1)
- Week 1-2: Memory Graph Backend
- Week 3-4: "I Was There" Tagging
- Week 5-6: Story Mergers

**Months 3-4**: Engagement + Premium (Phase 2.2 + 2.3)
- Week 7-9: Living Chapters
- Week 10-12: Rewind Feature
- Week 13-15: Shadow Self
- Week 16-18: Vault Mode

**Month 5**: Viral Mechanics (Phase 2.4)
- Week 19-21: Story Snippets
- Week 22-23: Referral Program
- Week 24: Before I Die Mode

**Month 6**: AI Enhancement (Phase 2.5)
- Week 25-27: Pattern Recognition & Predictions
- Week 28-30: Audio Interrogator

**Month 7**: Security (Phase 2.6)
- Week 31-33: Zero-Knowledge Email
- Week 34-36: Content Protection

**Month 8**: Location (Phase 2.7)
- Week 37-39: Live Maps
- Week 40-42: Location Interrogation

**Month 9**: Enterprise (Phase 2.8)
- Week 43-48: Corporate Biography Service

**Total Timeline**: 9 months for full implementation
**MVP (Critical Features Only)**: 4 months (Phases 2.1, 2.2, 2.4)

---

## Integration with Existing System

### Leveraging Current Infrastructure

**Existing Payment System (Phase 1.4)**:
- ✅ Already have Stripe/PayPal
- ✅ Subscription tier logic exists
- **Add**: New tiers (Platinum $100+, Vault $500+)
- **Extend**: Revenue share for Story Mergers

**Existing Chapter System (Phase 1.5)**:
- ✅ Chapters already exist
- ✅ Access control in place
- **Add**: Living Chapters with status tracking
- **Extend**: Chapter completion detection AI

**Existing Editor (Tiptap)**:
- ✅ Rich text editing ready
- **Add**: @mention tagging for "I Was There"
- **Extend**: Merger split-screen view

**Existing Dashboard**:
- ✅ Revenue charts exist
- **Add**: Memory Graph visualization
- **Extend**: Pattern/prediction insights

### Breaking Changes (Minimize)

**Database**:
- All new models, no changes to existing
- User model additions are backward compatible
- Migrations can run without downtime

**API**:
- All new endpoints under `/api/v2/`
- Existing v1 endpoints unchanged
- No breaking changes to client apps

**Frontend**:
- New routes don't affect existing pages
- Shared components (header, sidebar) extended but compatible

---

## Next Steps

### Immediate Actions (Week 0)

1. **Review and Approve Roadmap**
   - [ ] Stakeholder buy-in
   - [ ] Budget approval
   - [ ] Timeline confirmation

2. **Team Preparation**
   - [ ] Hire AI/ML Engineer (if needed)
   - [ ] Onboard existing team to PRD
   - [ ] Set up project management (Linear/Jira)

3. **Technical Setup**
   - [ ] Create Phase 2 branch
   - [ ] Set up staging environment
   - [ ] Configure CI/CD for new services

4. **Legal Preparation**
   - [ ] Consult lawyer on NDA templates
   - [ ] Review GDPR implications
   - [ ] Draft updated ToS

5. **Design Preparation**
   - [ ] Create mockups for Memory Graph
   - [ ] Design Rewind interface
   - [ ] Prototype Vault Mode UX

### Week 1 Sprint Plan

**Backend**:
- [ ] Create Connection model in Prisma schema
- [ ] Implement basic collision detection (temporal overlap)
- [ ] Set up background job queue for detection

**Frontend**:
- [ ] Create Memory Graph page skeleton
- [ ] Design connection visualization component
- [ ] Build tag notification UI

**DevOps**:
- [ ] Set up Redis for caching
- [ ] Configure job queue (Bull/BullMQ)
- [ ] Add monitoring for new services

---

## Conclusion

This roadmap transforms Lifeline from a solid monetized biography platform into **an irreplaceable social memory network**. The key insight: once users have tagged friends, built their Memory Graph, and subscribers are paying for Living Chapters, **leaving the platform means losing an irreplaceable asset**.

**The network effects create lock-in:**
- Your memories are connected to friends' memories
- Your story gains value from others' perspectives
- Subscribers are invested in your ongoing narrative
- Your patterns/predictions are unique to this platform

**The viral mechanics create growth:**
- Tagged friends must join to verify
- Story Snippets drive social media acquisition
- Referrals are incentivized financially
- Before I Die Mode creates emotional urgency

**The premium features justify pricing:**
- Shadow Self is unavailable elsewhere
- Vault Mode with legal NDAs is unprecedented
- AI Life Coach provides unique value
- Prediction Engine is sci-fi made real

**Timeline**: 9 months to build, 12-18 months to scale to market leader.

**This is the path to 500k creators, 5M subscribers, $50M ARR.**
