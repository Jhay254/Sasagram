# Lifeline Monetization API Documentation

## Authentication
All endpoints (except webhooks) require a valid Bearer token in the Authorization header.
`Authorization: Bearer <token>`

## Subscriptions

### Create Subscription
Initiate a new subscription for a user to a creator's tier.

**POST** `/api/subscriptions/create`

**Body:**
```json
{
  "creatorId": "uuid",
  "tierId": "uuid"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "status": "pending",
    "currentPeriodStart": "2023-01-01T00:00:00Z",
    "currentPeriodEnd": "2023-02-01T00:00:00Z"
  },
  "approvalUrl": "https://www.sandbox.paypal.com/..."
}
```

### Cancel Subscription
Cancel an active subscription. It will remain active until the end of the current billing period.

**POST** `/api/subscriptions/:id/cancel`

**Response:**
```json
{
  "success": true,
  "message": "Subscription canceled successfully"
}
```

### Get My Subscriptions
Get all subscriptions for the authenticated user.

**GET** `/api/subscriptions/my-subscriptions`

**Response:**
```json
[
  {
    "id": "uuid",
    "status": "active",
    "tier": { "name": "Gold", "price": 29.99 },
    "creator": { "name": "Creator Name" }
  }
]
```

## Tiers (Creator Only)

### Get Creator Tiers
Get all active tiers for a creator.

**GET** `/api/tiers/:creatorId`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Bronze",
    "price": 9.99,
    "features": ["Feature 1", "Feature 2"]
  }
]
```

### Create Tier
Create a new subscription tier.

**POST** `/api/tiers`

**Body:**
```json
{
  "name": "Platinum",
  "price": 49.99,
  "features": ["All access", "Direct messaging"]
}
```

### Update Tier
Update an existing tier.

**PUT** `/api/tiers/:id`

**Body:**
```json
{
  "price": 59.99,
  "isActive": true
}
```

## Revenue Dashboard (Creator Only)

### Get Metrics
Get key performance indicators.

**GET** `/api/revenue/metrics`

**Response:**
```json
{
  "activeSubscribers": {
    "total": 150,
    "byTier": { "Bronze": 100, "Gold": 50 }
  },
  "mrr": 2498.50,
  "churnRate": 2.5,
  "growth": {
    "subscribers": 5.2,
    "revenue": 4.8
  }
}
```

### Get Earnings History
Get monthly earnings breakdown.

**GET** `/api/revenue/earnings?months=12`

**Response:**
```json
[
  {
    "month": "2023-10",
    "revenue": 2400.00,
    "subscribers": 145,
    "payoutStatus": "paid"
  }
]
```

### Request Payout
Request a payout of pending funds (min $50).

**POST** `/api/revenue/payout/request`

**Response:**
```json
{
  "id": "uuid",
  "amount": 500.00,
  "status": "processing",
  "providerPayoutId": "..."
}
```

## Content Access

### Set Chapter Access
Set the access level for a specific chapter.

**POST** `/api/content-access/chapter/:chapterId`

**Body:**
```json
{
  "accessLevel": "gold" // public, private, bronze, gold
}
```

### Bulk Set Access
Update access levels for multiple chapters.

**POST** `/api/content-access/bulk`

**Body:**
```json
{
  "chapters": [
    { "chapterId": "uuid1", "accessLevel": "bronze" },
    { "chapterId": "uuid2", "accessLevel": "gold" }
  ]
}
```

## Webhooks

### PayPal Webhook
Handle payment events from PayPal.

**POST** `/api/subscriptions/webhooks/paypal`

**Headers:**
`paypal-transmission-sig`: <signature>
