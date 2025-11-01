# Deployment Guide - Railway Backend + Database

This guide walks you through deploying the backend API and PostgreSQL database to Railway.

## Prerequisites

- GitHub account (with this repository pushed)
- Railway account (sign up at https://railway.app)
- Clerk account with API keys ready

## Step 1: Create Railway Project

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project"
3. Select "Deploy PostgreSQL" - this creates a PostgreSQL database service
4. Wait for the database to provision (takes ~30 seconds)

## Step 2: Get Database Connection String

1. Click on the PostgreSQL service
2. Go to the "Variables" tab
3. Copy the `DATABASE_URL` - you'll need this for migrations

## Step 3: Add Backend Service

1. In your Railway project, click "+ New"
2. Select "GitHub Repo" and choose your repository
3. Railway will detect the backend - click "Add Service"
4. **Important**: In service settings, set:
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

## Step 4: Link Database to Backend

1. In your backend service, go to "Settings" → "Variables"
2. Click "Reference Variable"
3. Select the PostgreSQL service and `DATABASE_URL`
4. This auto-injects the database URL into your backend

## Step 5: Configure Environment Variables

In your backend service → "Variables" tab, add:

```
NODE_ENV=production
PORT=3000
CLERK_SECRET_KEY=sk_live_... (or sk_test_... for testing)
FRONTEND_URL=http://localhost:3000
```

**Note**: Railway will automatically provide `PORT` and `DATABASE_URL`, but setting them explicitly is fine.

## Step 6: Run Database Migrations

After the backend service is deployed, run migrations:

### Option A: Using Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project (select your project when prompted)
railway link

# Run migrations
railway run npm run db:migrate

# Optionally seed the database
railway run npm run db:seed
```

### Option B: Using Railway Dashboard

1. In Railway dashboard, go to your backend service
2. Click "Deployments" → "View Logs"
3. Open the "Terminal" tab
4. Run:
   ```bash
   npm run db:migrate
   npm run db:seed  # Optional
   ```

## Step 7: Get Your Backend URL

1. In Railway dashboard, go to your backend service
2. Click "Settings" → "Networking"
3. Generate a domain (e.g., `your-app.up.railway.app`)
4. Copy this URL - this is your backend API URL

## Step 8: Configure Clerk

1. Go to your Clerk Dashboard
2. Navigate to "Domains" settings
3. Add your Railway backend domain to allowed origins
4. If using webhooks, update webhook URLs to point to Railway backend

## Step 9: Update Frontend Environment Variables

In your local `frontend/.env.local`, add:

```env
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
# Keep your existing Clerk variables
```

## Step 10: Test the Deployment

1. Visit `https://your-backend-url.up.railway.app/api/health`
   - Should return `{"status":"ok"}`
2. Check Railway logs for any errors
3. Test your frontend locally - it should connect to the deployed backend

## Step 11: Set Up Admin User

After deployment, you need to mark a user as admin in the database:

```bash
# Using Railway CLI
railway run npx prisma studio

# Or directly via SQL in Railway dashboard terminal:
railway run npx prisma db execute --stdin
# Then paste:
# UPDATE users SET "isAdmin" = true WHERE email = 'your-admin-email@example.com';
```

Alternatively, the seed script creates an admin user with email `admin@example.com` - you can update that email to match your Clerk user email.

## Continuous Deployment

Railway automatically deploys when you push to your main branch. The watch path is set to `/backend/**`, so only backend changes trigger deployments.

## Troubleshooting

### Build Fails

- Check Railway logs for build errors
- Ensure `package.json` has all required dependencies
- Verify TypeScript compiles locally: `npm run build`

### Database Connection Issues

- Verify `DATABASE_URL` is properly linked
- Check database service is running
- Ensure migrations have run successfully

### CORS Errors

- Verify `FRONTEND_URL` environment variable is set correctly
- Check Railway backend URL matches what's in frontend `.env.local`
- Ensure Clerk domains are configured correctly

### Admin Access Denied

- Verify user exists in database
- Check `isAdmin` field is set to `true` in database
- Use Railway CLI or Prisma Studio to update: `UPDATE users SET "isAdmin" = true WHERE id = 'your-user-id';`

## Useful Commands

```bash
# View logs
railway logs

# Run migrations
railway run npm run db:migrate

# Open Prisma Studio
railway run npx prisma studio

# Execute SQL directly
railway run npx prisma db execute --stdin
```

## Next Steps

- Set up monitoring/alerts in Railway
- Configure custom domain (optional)
- Set up staging environment (create separate Railway project)
- Configure backups for PostgreSQL database
