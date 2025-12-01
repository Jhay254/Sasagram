# Lifeline Deployment Guide

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- PayPal Business account (for payments)
- OpenAI API key
- Google Cloud Vision API credentials

## Backend Deployment

### 1. Environment Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your production values
```

### 2. Database Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

### 3. Build & Start
```bash
npm run build
npm run start:prod
```

### Recommended Hosting: Railway, Render, or Heroku
- Set environment variables in platform dashboard
- Connect PostgreSQL database
- Deploy from GitHub repository

## Frontend Deployment

### 1. Environment Setup
```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL
```

### 2. Build
```bash
npm run build
```

### Recommended Hosting: Vercel (Optimal for Next.js)

#### Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

Or connect your GitHub repository to Vercel dashboard for automatic deployments.

#### Environment Variables (Vercel):
- `NEXT_PUBLIC_API_URL`: Your backend API URL
- `NEXT_PUBLIC_APP_URL`: Your frontend URL

## Post-Deployment Checklist

### Backend
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] PayPal webhooks configured
- [ ] OAuth redirect URIs updated
- [ ] SSL certificate installed
- [ ] CORS configured for frontend domain

### Frontend
- [ ] API URL pointing to production backend
- [ ] SEO metadata verified
- [ ] Analytics integrated (if applicable)
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled

### Testing
- [ ] Login/Register flow works
- [ ] OAuth connections work
- [ ] Payment flow tested (sandbox mode)
- [ ] Editor saves content
- [ ] Public profiles accessible
- [ ] Mobile responsiveness verified

## Monitoring & Maintenance

### Logs
- Backend: Check platform logs (Railway/Render)
- Frontend: Vercel deployment logs

### Database Backups
- Enable automated backups on your database provider
- Recommended: Daily backups with 7-day retention

### Security
- Rotate JWT secrets regularly
- Keep dependencies updated: `npm audit fix`
- Monitor for security vulnerabilities

## Scaling Considerations

### Database
- Start with basic PostgreSQL plan
- Scale vertically as user base grows
- Consider read replicas for high traffic

### Backend
- Start with 1 instance
- Enable auto-scaling based on CPU/memory
- Add Redis for session management at scale

### Frontend
- Vercel handles scaling automatically
- Enable CDN for static assets
- Consider ISR (Incremental Static Regeneration) for public profiles

## Support
For issues, contact: support@lifeline.app
