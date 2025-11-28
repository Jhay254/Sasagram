# OAuth Data Fetching Services - COMPLETE

## ✅ Services Implemented

I've built the three core data fetching services that enable real biography generation:

### 1. Instagram Sync Service
**File**: `backend/src/services/sync/instagram-sync.service.ts`

**Features:**
- Fetches posts from Instagram Graph API
- Handles pagination (100 posts per batch)
- Saves posts as SocialPost records
- Saves media as MediaItem records
- Supports location data fetching
- Rate limiting (100ms between requests)
- Duplicate detection
- Error handling with retry logic

**Methods:**
- `syncDataSource()` - Main entry point
- `fetchUserPosts()` - Fetch all posts with pagination
- `fetchMediaWithLocation()` - Fetch media with GPS data

### 2. Twitter Sync Service
**File**: `backend/src/services/sync/twitter-sync.service.ts`

**Features:**
- Uses Twitter API v2 (twitter-api-v2 library)
- Fetches user timeline with pagination
- Saves tweets as SocialPost records
- Includes public metrics (likes, retweets)
- Geo data support
- Rate limiting (15-minute windows)
- Error handling for rate limit 429 errors

**Methods:**
- `syncDataSource()` - Main entry point
- `fetchUserTweets()` - Fetch timeline
- `fetchTweetsWithMedia()` - Only tweets with attachments

### 3. Gmail Sync Service
**File**: `backend/src/services/sync/gmail-sync.service.ts`

**Features:**
- Uses Google APIs (googleapis library)
- Smart event detection (flights, hotels, tickets, conferences)
- Email categorization (TRAVEL_FLIGHT, TRAVEL_HOTEL, EVENT_TICKET, etc.)
- Saves as EmailMetadata records
- Batch processing (100 emails at a time)
- Rate limiting
- Header parsing (From, To, Subject, Date)

**Methods:**
- `syncDataSource()` - Main entry point
- `fetchEventEmails()` - Fetch event-related emails only
- `fetchAllEmails()` - Fetch all primary emails (use sparingly)
- `categorizeEmail()` - Automatic categorization

---

## How They Work

### Sync Flow:
```typescript
1. Get DataSource record with access token
2. Update status to IN_PROGRESS
3. Call provider API with pagination
4. Save data to database (SocialPost/MediaItem/EmailMetadata)
5. Update DataSource:
   - syncStatus: COMPLETED
   - lastSyncAt: currentTime
   - itemCount: +fetched
6. Handle errors → syncStatus: FAILED
```

### Rate Limiting:
- Instagram: 100ms delay between requests
- Twitter: Automatic handling via twitter-api-v2
- Gmail: 100ms delay between fetches
- All: Detect 429 errors and retry after delay

### Duplicate Prevention:
```typescript
// Check before inserting
const existing = await prisma.socialPost.findFirst({
  where: { dataSourceId, externalId: item.id }
});
if (existing) return; // Skip
```

---

## Required NPM Packages

```bash
npm install axios twitter-api-v2 googleapis node-cron
```

**Note**: The installation command failed due to PowerShell execution policy. You'll need to either:
1. Run PowerShell as Administrator and execute:
   ```powershell
   Set-ExecutionPolicy RemoteSigned
   ```
2. Or manually install packages in the backend directory

---

## Next Steps

### Immediate:
1. **Install npm packages** (see above)
2. **Create sync controller** for API endpoints
3. **Add token refresh logic** to OAuth service
4. **Set up cron jobs** for background sync

### This Week:
5. Biography API integration
6. Subscription/payment UI
7. Testing with real accounts

---

## Usage Example

```typescript
import { InstagramSyncService } from './services/sync/instagram-sync.service';

// Trigger sync for a data source
const result = await InstagramSyncService.syncDataSource('data-source-id');

console.log(result);
// {
//   success: true,
//   itemsFetched: 157,
//   itemsProcessed: 157,
//   errors: []
// }
```

---

## Files Created

1. `backend/src/services/sync/instagram-sync.service.ts`
2. `backend/src/services/sync/twitter-sync.service.ts`
3. `backend/src/services/sync/gmail-sync.service.ts`

---

## Status

✅ **COMPLETE**: Core sync services built
🔄 **NEXT**: Install packages, create API endpoints, test with real data
