# Supabase Setup Guide

Complete guide to set up Supabase PostgreSQL for UnFrame AI backend.

## Why Supabase?

✅ **pgvector ready**: Pre-installed for future AI features  
✅ **Zero maintenance**: Fully managed PostgreSQL  
✅ **AI-optimized**: Built for modern AI applications  
✅ **Free tier**: 500MB database, perfect for development  
✅ **Future-proof**: Ready for vector search, embeddings, RAG  

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended)
4. Click "New Project"
5. Fill in:
   - **Name**: `unframe-ai` (or your preference)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Plan**: Start with Free tier

### 2. Get Database Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.abcdefghijklmnop:your-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

### 3. Configure Environment

1. Copy the environment template:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and update the `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres.your-project-ref:your-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   ```

   **Replace:**
   - `your-project-ref`: Your actual project reference
   - `your-password`: Your database password
   - `us-east-1`: Your selected region

### 4. Install Dependencies and Migrate

```bash
# Install PostgreSQL dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Create and apply initial migration
pnpm prisma migrate dev --name init
```

### 5. Verify Setup

Check that tables were created in Supabase:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see tables: `User`, `File`, `Email`, `TrelloBoard`, `TrelloCard`, `Session`

Or run:
```bash
pnpm prisma:studio
```

## Connection String Examples

### Development
```env
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:yourpassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Production (same as development with Supabase)
```env
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:yourpassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

## Supabase Dashboard Features

### 1. **Table Editor**
- Visual database interface
- Edit data directly
- Create indexes and relationships

### 2. **SQL Editor**
- Run custom SQL queries
- Test your NL-to-SQL generated queries
- Enable pgvector when ready

### 3. **Database Settings**
- Monitor performance
- View connection stats
- Manage backups

### 4. **API Documentation**
- Auto-generated REST APIs
- PostgREST integration
- Real-time subscriptions

## Enable pgvector (Future AI Features)

When you're ready for vector operations:

1. Go to **SQL Editor** in Supabase
2. Run this SQL:
   ```sql
   -- Enable pgvector extension
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- Verify installation
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

3. Add vector columns to your schema:
   ```sql
   -- Example: Add embeddings to File table
   ALTER TABLE "File" ADD COLUMN embedding vector(1536);
   
   -- Create vector index for similarity search
   CREATE INDEX ON "File" USING ivfflat (embedding vector_cosine_ops);
   ```

## Future AI Features You Can Build

With pgvector enabled, you can implement:

### 1. **Semantic File Search**
```javascript
// Find files similar to a query
"Find documents similar to this research paper"
```

### 2. **Content-based Email Grouping**
```javascript
// Group emails by semantic similarity
"Show me all emails about the quarterly planning"
```

### 3. **Smart Trello Card Recommendations**
```javascript
// Suggest related cards
"Find tasks similar to this bug report"
```

### 4. **RAG-powered Queries**
```javascript
// Enhanced LangChain with document context
"What did John say about the project timeline in recent emails?"
```

## Troubleshooting

### Connection Issues

**Error: `ENOTFOUND`**
- Check your internet connection
- Verify the connection string is correct
- Ensure no typos in project reference

**Error: `password authentication failed`**
- Double-check your database password
- Reset password in Supabase Dashboard → Settings → Database

**Error: `too many connections`**
- Supabase uses connection pooling
- This shouldn't happen with normal usage
- Check for connection leaks in your code

### Migration Issues

**Error: `relation already exists`**
- Reset your database in Supabase:
  1. Go to Settings → Database
  2. Scroll to "Reset database password"
  3. This will clear all tables
  4. Re-run migrations

**Error: `Prisma Client not found`**
- Run: `pnpm prisma:generate`
- Restart your development server

## Development Workflow

```bash
# Start development server
pnpm dev

# Open Prisma Studio (visual database editor)
pnpm prisma:studio

# Create new migration
pnpm prisma migrate dev --name your_migration_name

# Reset database (development only!)
pnpm prisma migrate reset

# Deploy migrations to production
pnpm prisma migrate deploy
```

## Cost Management

### Free Tier Limits
- **Database size**: 500MB
- **Bandwidth**: 5GB/month
- **Monthly active users**: 50,000

### Monitoring Usage
1. Go to **Settings** → **Billing**
2. Monitor database size and bandwidth
3. Set up usage alerts

### Optimization Tips
- Use efficient queries in your NL-to-SQL
- Implement proper indexes
- Clean up test data regularly

## Production Considerations

### Security
- Enable Row Level Security (RLS) for sensitive data
- Use environment variables for credentials
- Enable database backups

### Performance
- Monitor query performance in Supabase dashboard
- Use database indexes effectively
- Consider read replicas for high traffic

### Scaling
- Supabase auto-scales within your plan
- Upgrade to Pro plan when needed ($25/month)
- Consider dedicated instances for enterprise

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Configure DATABASE_URL
3. ✅ Run migrations
4. 🔄 Test NL-to-SQL functionality
5. 🔄 Deploy your application
6. 🚀 Implement vector search when ready

Your PostgreSQL database is now ready for both current features and future AI enhancements! 🎉