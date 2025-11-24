# Fix Supabase Connection Issues

## Problem
You're getting `MaxClientsInSessionMode` or timeout errors because your Supabase connection is using **Session mode pooling** which has very limited connections.

## Solution: Switch to Transaction Mode

### Step 1: Update Your DATABASE_URL

Your current DATABASE_URL uses **port 5432** (Session mode).  
You need to change it to **port 6543** (Transaction mode).

#### Current URL format:
```
postgresql://user:password@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

#### New URL format (change port to 6543):
```
postgresql://user:password@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

### Step 2: Update .env File

Open your `.env` file and change the port in DATABASE_URL from **5432** to **6543**.

Example:
```env
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

### Step 3: Important Configuration Notes

**Transaction Mode Limitations:**
- ❌ Does NOT support: Prepared statements, session-level settings
- ❌ Does NOT support: Long-running transactions
- ✅ DOES support: Most Django operations
- ✅ DOES support: Many concurrent connections

**If you need Session mode features**, you have two options:
1. **Direct connection** (not pooled) - Change host from `pooler.supabase.com` to direct endpoint
2. **Upgrade Supabase plan** - Get more session pooler connections

### Step 4: Alternative - Use Direct Connection

If transaction mode doesn't work for your needs, use the **direct connection**:

Get your direct connection string from Supabase Dashboard:
1. Go to Supabase Dashboard → Settings → Database
2. Look for "Connection string" → "Direct connection"
3. Copy the URL (should have a different host, not pooler.supabase.com)

Example direct connection:
```env
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

**Note**: Direct connections have a hard limit (typically 60-100 connections), so you'll need to use `CONN_MAX_AGE=0` to close connections after each request.

---

## Quick Fix Commands

After updating your `.env` file:

```powershell
# Test the connection
python manage.py check --database default

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver
```

---

## Recommended: Use Transaction Mode (Port 6543)

For most Django apps, **Transaction mode** is the best choice:
- ✅ Supports thousands of connections
- ✅ Perfect for web applications
- ✅ Works with Django ORM operations
- ⚠️ Just don't use raw SQL with session-level features

