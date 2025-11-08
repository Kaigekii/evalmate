# 🚀 EVALMATE DEPLOYMENT FIX GUIDE

## ✅ ISSUES FIXED:

### 1. **MISSING DEPLOYMENT FILES** ✔️
**Created:**
- `Procfile` - Tells Render how to run the app
- `build.sh` - Build script for deployment
- `runtime.txt` - Specifies Python version

### 2. **DATABASE CONFIGURATION** ✔️
**Fixed:**
- Now properly uses `DATABASE_URL` environment variable in production
- Falls back to individual env vars for local development
- Uses `dj_database_url` package for parsing

### 3. **SECURITY SETTINGS** ✔️
**Fixed:**
- `DEBUG = False` in production
- `ALLOWED_HOSTS` properly configured
- `SESSION_COOKIE_SECURE = True` in production
- `CSRF_COOKIE_SECURE = True` in production
- `SECURE_SSL_REDIRECT = True` in production

### 4. **INCORRECT REDIRECT URLS** ✔️
**Fixed:**
- Changed `/student/` → `/dashboard/student/`
- Changed `/faculty/` → `/dashboard/faculty/`
- Now matches your actual URL patterns

### 5. **MISSING IMPORTS** ✔️
**Fixed:**
- Added `User` model import
- Moved `random`, `string`, `threading` to top-level imports
- Removed duplicate inline imports

---

## 📋 RENDER.COM DEPLOYMENT STEPS:

### Step 1: Set Environment Variables on Render
Go to your Render dashboard → Environment → Add the following:

```bash
# ⚠️ IMPORTANT: You're using SUPABASE (which IS PostgreSQL)
# Option A: Use DATABASE_URL (Recommended - Single connection string)
DATABASE_URL=postgresql://postgres.quifctsbspsveatadpln:m0CBnUSNt9yF0oZj@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require

# Option B: Use individual variables (if DATABASE_URL not set)
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=postgres
DATABASE_USER=postgres.quifctsbspsveatadpln
DATABASE_PASSWORD=m0CBnUSNt9yF0oZj
DATABASE_HOST=aws-1-us-east-2.pooler.supabase.com
DATABASE_PORT=5432
DATABASE_SSLMODE=require

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-app-name.onrender.com

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=EvalMate <your-email@gmail.com>

# Site URL
SITE_URL=https://your-app-name.onrender.com

# Render hostname (auto-detected)
RENDER_EXTERNAL_HOSTNAME=your-app-name.onrender.com
```

### Step 2: Configure Render Service

**Build Command:**
```bash
./build.sh
```

**Start Command:**
```bash
gunicorn EvalMate.EvalMate.wsgi:application
```

### Step 3: Database Setup
**✅ YOU DON'T NEED TO CREATE A NEW DATABASE!**

You're already using **Supabase**, which IS PostgreSQL. Just set the `DATABASE_URL` environment variable on Render with your Supabase connection string:

```bash
DATABASE_URL=postgresql://postgres.quifctsbspsveatadpln:m0CBnUSNt9yF0oZj@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**OR** use individual environment variables (DATABASE_HOST, DATABASE_USER, etc.)

### Step 4: Deploy
1. Push these changes to GitHub:
   ```bash
   git add .
   git commit -m "Fix deployment issues - add Procfile, build.sh, security settings"
   git push origin main
   ```

2. Render will automatically deploy

---

## ⚠️ IMPORTANT: FOR LOCAL DEVELOPMENT

To run locally with the new changes, update your `.env` file:

```env
# Development settings
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (use your Supabase credentials)
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=postgres
DATABASE_USER=postgres.quifctsbspsveatadpln
DATABASE_PASSWORD=m0CBnUSNt9yF0oZj
DATABASE_HOST=aws-1-us-east-2.pooler.supabase.com
DATABASE_PORT=5432
DATABASE_SSLMODE=require

# Secret Key
SECRET_KEY=django-insecure-j1h1gdft0^9!z6cs!%l=9s#+h)gr9dg-booha9lr)^d1#^y@)o

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=markantoncamoro@gmail.com
EMAIL_HOST_PASSWORD=lsbygfikpovxtigw
DEFAULT_FROM_EMAIL=EvalMate <markantoncamoro@gmail.com>

# Site URL
SITE_URL=http://127.0.0.1:8000
```

---

## 🐛 COMMON DEPLOYMENT ERRORS & SOLUTIONS:

### Error: "Static files not found"
**Solution:** Make sure `build.sh` runs `collectstatic`
```bash
python manage.py collectstatic --no-input
```

### Error: "DisallowedHost at /"
**Solution:** Add your Render domain to `ALLOWED_HOSTS` in environment variables

### Error: "No module named 'psycopg2'"
**Solution:** Already fixed - `psycopg2-binary` is in `requirements.txt`

### Error: "CSRF verification failed"
**Solution:** Make sure `CSRF_COOKIE_SECURE` and `SESSION_COOKIE_SECURE` are set correctly based on HTTPS

### Error: "Email not sending"
**Solution:** 
1. Use Gmail App Password (not regular password)
2. Enable 2-factor authentication on Gmail
3. Generate an App Password: https://myaccount.google.com/apppasswords

---

## 🔍 WHAT EACH FILE DOES:

### `Procfile`
Tells Render to use Gunicorn to serve your Django app

### `build.sh`
Runs during deployment:
1. Installs Python packages
2. Collects static files
3. Runs database migrations

### `runtime.txt`
Specifies Python 3.11.5 (compatible with Django 5.2.6)

### `requirements.txt`
Lists all Python dependencies (already had everything needed)

---

## ✅ VERIFICATION CHECKLIST:

Before deploying, ensure:
- [ ] All changes committed to GitHub
- [ ] Environment variables set on Render
- [ ] PostgreSQL database created and linked
- [ ] Build command: `./build.sh`
- [ ] Start command: `gunicorn EvalMate.EvalMate.wsgi:application`
- [ ] `RENDER_EXTERNAL_HOSTNAME` matches your Render app URL

---

## 🎯 WHAT'S FIXED IN CODE:

### `settings.py`
- ✅ Production-safe defaults
- ✅ Dynamic `DATABASE_URL` parsing
- ✅ Security headers enabled
- ✅ Proper static files configuration

### `views.py`
- ✅ Correct redirect URLs
- ✅ All imports at top of file
- ✅ No duplicate imports
- ✅ Proper error handling

### New Files
- ✅ `Procfile` for web server
- ✅ `build.sh` for deployment
- ✅ `runtime.txt` for Python version

---

## 🚨 CRITICAL: TEST LOCALLY FIRST

Run these commands to test:

```bash
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install/update dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --no-input

# Run server
python manage.py runserver
```

If local works, deployment will work!

---

## 📞 SUPPORT

If deployment still fails:
1. Check Render logs: Dashboard → Logs
2. Look for specific error messages
3. Common issues are usually:
   - Missing environment variables
   - Database connection errors
   - Static files not collected

---

**Last Updated:** November 8, 2025
**Status:** ✅ READY TO DEPLOY
