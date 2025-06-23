# Task 11: Deployment & Production Setup

## Objective

Deploy the frontend application to Vercel with proper environment configuration and monitoring.

## Requirements

- [ ] Deploy to Vercel platform
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Configure CDN and edge functions
- [ ] Set up monitoring and analytics
- [ ] Production optimization

## Deployment Steps

### 1. Vercel Project Setup

1. Connect GitHub repository to Vercel
2. Import project with Next.js framework detection
3. Configure build settings
4. Set up automatic deployments

### 2. Environment Configuration

#### Production Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API=https://api.worldcup2024.example.com

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=1234567

# Error Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Feature Flags (Optional)
NEXT_PUBLIC_ENABLE_SIMULATION=true
```

#### Preview Environment Variables

```bash
# Staging API
NEXT_PUBLIC_API=https://api-staging.worldcup2024.example.com

# Clerk Authentication (Test Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Development flags
NEXT_PUBLIC_DEBUG_MODE=true
```

### 3. Build Configuration

#### next.config.js Optimization

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Image optimization
  images: {
    domains: ['api.worldcup2024.example.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Security headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ],

  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    bundleAnalyzerConfig: {
      enabled: true,
    },
  }),
};

module.exports = nextConfig;
```

### 4. Custom Domain Setup

1. Add custom domain in Vercel dashboard
2. Configure DNS records:
   ```
   Type: CNAME
   Name: predictions (or @)
   Value: cname.vercel-dns.com
   ```
3. Enable automatic HTTPS
4. Configure domain redirects if needed

### 5. Performance Configuration

#### Vercel.json Configuration

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1", "fra1"],
  "functions": {
    "app/**": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

#### Edge Functions (Optional)

- Middleware optimization for edge runtime
- Geolocation-based redirects
- A/B testing configuration
- Bot detection and blocking

### 6. Monitoring Setup

#### Error Monitoring (Sentry Integration)

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out development errors
      if (event.environment === 'development') {
        return null;
      }
      return event;
    },
  });
}
```

#### Analytics Integration

```typescript
// lib/analytics.ts
import { gtag } from 'ga-gtag';

export const trackEvent = (
  action: string,
  category: string,
  label?: string
) => {
  if (process.env.NEXT_PUBLIC_GA_ID) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
};

// Usage in components
trackEvent('login', 'authentication', 'google_oauth');
trackEvent('form_submit', 'predictions', 'final_submission');
```

### 7. Production Optimizations

#### Bundle Size Optimization

1. Run bundle analyzer: `ANALYZE=true npm run build`
2. Remove unused dependencies
3. Implement code splitting for large components
4. Optimize images and assets

#### Performance Monitoring

```typescript
// lib/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds.`);
  } else {
    fn();
  }
};
```

### 8. CI/CD Pipeline

#### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 9. Health Checks and Monitoring

#### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Basic health check
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
  };

  return NextResponse.json(health);
}
```

#### Uptime Monitoring

- Set up external monitoring (UptimeRobot, Pingdom)
- Configure alerts for downtime
- Monitor key user journeys
- Set up performance thresholds

### 10. Security Considerations

#### Security Headers

```typescript
// middleware.ts security enhancements
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}
```

#### Content Security Policy

```typescript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.clerk.accounts.dev *.clerk.com *.google.com *.googletagmanager.com;
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  img-src 'self' blob: data: *.clerk.com *.googleusercontent.com;
  font-src 'self' fonts.gstatic.com;
  connect-src 'self' *.clerk.accounts.dev *.clerk.com;
  frame-src *.clerk.accounts.dev *.clerk.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' *.clerk.accounts.dev *.clerk.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;
```

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Build passes without errors
- [ ] Performance audit completed (Lighthouse >90)
- [ ] Security headers configured
- [ ] Error monitoring set up
- [ ] Analytics tracking implemented

### Post-Deployment

- [ ] Custom domain configured and working
- [ ] HTTPS certificate active
- [ ] All routes accessible
- [ ] API integration working
- [ ] Real user monitoring active
- [ ] Error tracking functional

### Production Testing

- [ ] Complete user journey testing
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Performance under load
- [ ] Error handling in production
- [ ] SEO metadata correct

## Rollback Plan

1. Revert to previous Vercel deployment
2. Update DNS if needed
3. Monitor error rates and user feedback
4. Document issues for fixing
5. Plan hotfix deployment if critical

## Post-Launch Tasks

- [ ] Monitor error rates first 24 hours
- [ ] Review performance metrics
- [ ] Check user feedback
- [ ] Document any issues found
- [ ] Plan iteration improvements

## Dependencies

- Depends on: Task 10 (Polish & Testing)
- Final production task

## Estimated Time

4-6 hours

## Priority

Critical - Required for production launch
