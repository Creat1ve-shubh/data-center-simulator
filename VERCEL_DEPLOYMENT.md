# Vercel Environment Variables Setup Guide

## 🔧 Required Environment Variables

To deploy this application to Vercel, you need to configure the following environment variables in your Vercel project settings.

## Setup Instructions

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Production Environment Variables

| Variable Name | Value | Environment | Description |
|--------------|-------|-------------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` | Production, Preview | PostgreSQL connection string |
| `REDIS_URL` | `redis://user:pass@host:6379` | Production, Preview | Redis connection string (optional) |
| `NEXT_PUBLIC_API_URL` | `https://your-domain.vercel.app` | Production, Preview | Your Vercel deployment URL |

#### Database URL Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require
```

**Important Notes:**
- Always append `?sslmode=require` for hosted PostgreSQL databases
- For Vercel Postgres: The connection string is automatically provided
- For external providers (AWS RDS, Supabase, Neon, etc.): Copy connection string from provider dashboard

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
vercel env add NEXT_PUBLIC_API_URL production

# Pull environment variables locally (optional)
vercel env pull
```

### Option 3: Via `.env` File for Local Development

Create a `.env.local` file in your project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/datacenter_simulator"

# Redis (optional, for caching)
REDIS_URL="redis://localhost:6379"

# API URL
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Disable telemetry
NEXT_TELEMETRY_DISABLED=1
```

**⚠️ NEVER commit `.env.local` to version control!**

## 🎯 Common Database Providers

### Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Create Database** → **Postgres**
4. Copy the connection string
5. Add it as `DATABASE_URL` environment variable

**Pros:**
- Seamless integration with Vercel
- Automatic connection pooling
- Built-in security

### Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **Database**
3. Copy the **Connection String** (URI format)
4. Add `?sslmode=require` at the end

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

### Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the **Connection String** from project dashboard
3. It already includes `?sslmode=require`

```
postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
```

### Railway

1. Create a PostgreSQL service at [railway.app](https://railway.app)
2. Go to **Variables** tab
3. Copy the `DATABASE_URL` value

### AWS RDS

1. Create a PostgreSQL instance in AWS RDS
2. Note the endpoint, port, username, password, and database name
3. Construct the connection string:

```
postgresql://[username]:[password]@[endpoint]:[port]/[database]?sslmode=require
```

## 🚀 Deployment Steps

### Initial Deployment

1. **Configure Environment Variables** (as described above)

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push origin main
   ```

3. **Deploy via GitHub Actions**
   - The CI/CD pipeline will automatically build and deploy
   - Monitor progress at: `https://github.com/[username]/[repo]/actions`

4. **Manual Deploy** (alternative)
   ```bash
   vercel --prod
   ```

### Verify Deployment

After deployment completes:

1. **Check Health Endpoint**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Test API Endpoints**
   ```bash
   npm run test:api:prod
   ```

3. **View Logs**
   ```bash
   vercel logs --follow
   ```

## 🔍 Troubleshooting

### Error: "Environment Variable references Secret that does not exist"

**Problem:** The `vercel.json` file references secrets using `@secret_name` syntax, but the secrets don't exist.

**Solution:** Remove the secret references from `vercel.json`:

```json
{
  "env": {
    "DATABASE_URL": "@database_url"  // ❌ REMOVE THIS
  }
}
```

Instead, add environment variables directly in Vercel Dashboard (Settings → Environment Variables).

### Error: "Prisma Client could not locate the Query Engine"

**Problem:** Prisma Client not generated during build.

**Solution:** Ensure `buildCommand` in `vercel.json` includes:
```json
{
  "buildCommand": "pnpm prisma generate && pnpm build"
}
```

### Error: "P1001: Can't reach database server"

**Problem:** Database connection string is incorrect or database is not accessible.

**Solutions:**
- Verify connection string format
- Check if `?sslmode=require` is appended for hosted databases
- Ensure database server allows connections from Vercel IPs
- Check database credentials (username, password)

### Error: "ECONNREFUSED 127.0.0.1:5432"

**Problem:** Application is trying to connect to localhost instead of remote database.

**Solution:** Ensure `DATABASE_URL` is set in Vercel environment variables for all environments (Production, Preview, Development).

## 📊 Environment Variable Best Practices

1. **Use Different Values per Environment**
   - Production: Real production database
   - Preview: Staging/test database
   - Development: Local database

2. **Never Commit Secrets**
   - Add `.env.local` to `.gitignore`
   - Use Vercel's secret management

3. **Use Connection Pooling**
   - For serverless functions, use Prisma Data Proxy or Prisma Accelerate
   - Or use PgBouncer for connection pooling

4. **Rotate Credentials Regularly**
   - Update database passwords periodically
   - Regenerate API keys and tokens

5. **Monitor Usage**
   - Set up database alerts for high connection counts
   - Monitor Vercel function execution times

## 🔐 Security Checklist

- [ ] Database credentials are stored as environment variables, not in code
- [ ] SSL mode is enabled for database connections (`?sslmode=require`)
- [ ] Environment variables are not exposed to client-side code (no `NEXT_PUBLIC_` prefix for secrets)
- [ ] Database user has minimal required permissions
- [ ] Firewall rules restrict database access
- [ ] Regular backups are configured
- [ ] Connection pooling is enabled

## 📚 Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables)
- [Prisma in Serverless Environments](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Database Connection Best Practices](https://vercel.com/guides/how-to-use-a-database-with-vercel)

## 🆘 Getting Help

If you continue to experience issues:

1. Check Vercel deployment logs: `vercel logs`
2. Review GitHub Actions workflow run logs
3. Verify all environment variables are set correctly
4. Test database connection locally first
5. Contact support or open an issue in the repository

---

**Last Updated:** January 2026
**Maintainer:** Data Center Simulator Team
