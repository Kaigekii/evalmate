# How to Run EvalMate Project

## ✅ Setup Complete!
Your project is now configured to use **Supabase with Transaction Mode Pooling** (port 6543).

---

## Quick Start

### 1. Start the Development Server
```powershell
python manage.py runserver
```

### 2. Access the Application
- **Main App**: http://127.0.0.1:8000/ (or http://localhost:8000/)
- **Login**: http://127.0.0.1:8000/login/
- **Admin Panel**: http://127.0.0.1:8000/admin/

**⚠️ Browser Issue?** If the app only works in incognito/private mode:
- Clear HSTS cache: `brave://net-internals/#hsts` (or `chrome://net-internals/#hsts`)
- Delete domain: `127.0.0.1` and `localhost`
- Or use a fresh port: `python manage.py runserver 8001`

---

## Common Commands

### Database Operations
```powershell
# Check database connection
python manage.py check --database default

# Create new migrations (after changing models.py)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser (admin account)
python manage.py createsuperuser
```

### Server Management
```powershell
# Run on default port (8000)
python manage.py runserver

# Run on custom port
python manage.py runserver 8080

# Make accessible on network
python manage.py runserver 0.0.0.0:8000
```

### Static Files
```powershell
# Collect static files for production
python manage.py collectstatic
```

### Shell Access
```powershell
# Django shell for testing queries
python manage.py shell

# Database shell
python manage.py dbshell
```

---

## Configuration Details

### Database
- **Provider**: Supabase PostgreSQL
- **Mode**: Transaction Pooling (port 6543)
- **Benefits**: Supports thousands of concurrent connections
- **Config File**: `.env` (DATABASE_URL)

### Environment Variables (.env)
```
DATABASE_URL    - Supabase connection string
SECRET_KEY      - Django secret key
DEBUG           - Debug mode (True for dev)
ALLOWED_HOSTS   - Allowed hostnames
EMAIL_*         - Email configuration
SITE_URL        - Base URL for the site
```

---

## Troubleshooting

### Issue: Only Works in Incognito/Private Mode
**Cause**: Browser cached HTTPS redirect (HSTS) or service workers

**Solutions**:
1. **Clear HSTS cache**:
   - Go to: `brave://net-internals/#hsts` (or `chrome://net-internals/#hsts`)
   - Delete domain: `127.0.0.1` and `localhost`
   
2. **Use different address**:
   - Try `http://localhost:8000/` instead of `http://127.0.0.1:8000/`
   
3. **Use different port**:
   ```powershell
   python manage.py runserver 8001
   ```
   Then access: http://127.0.0.1:8001/
   
4. **Clear browser cache** (Settings → Privacy → Clear browsing data)

5. **Disable "Auto-redirect to HTTPS"** in Brave/Chrome settings

### Issue: Database Connection Errors
**Solution**: Make sure you're using port **6543** (not 5432) in your DATABASE_URL

### Issue: "No migrations to apply"
This is normal - migrations are already applied. Only run `makemigrations` if you changed `models.py`

### Issue: Port Already in Use
```powershell
# Use different port
python manage.py runserver 8001
```

### Issue: Static Files Not Loading
```powershell
python manage.py collectstatic --noinput
```

---

## Development Workflow

1. **Activate virtual environment** (if not already active):
   ```powershell
   .\venv\Scripts\activate
   ```

2. **Make code changes**

3. **If you modified `models.py`**:
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Test locally**:
   ```powershell
   python manage.py runserver
   ```

5. **Access at**: http://127.0.0.1:8000/

---

## Project Structure
```
evalmate/
├── manage.py              # Django management script
├── .env                   # Environment variables (DATABASE_URL, etc.)
├── EvalMate/              # Project configuration
│   └── settings.py        # Django settings
├── EvalMateApp/           # Main application
│   ├── models.py          # Database models
│   ├── views.py           # View logic
│   ├── urls.py            # URL routing
│   └── forms.py           # Form definitions
├── static/                # CSS, JS, images
└── templates/             # HTML templates
```

---

## Next Steps

1. **Create a superuser** (if you haven't already):
   ```powershell
   python manage.py createsuperuser
   ```

2. **Start the server**:
   ```powershell
   python manage.py runserver
   ```

3. **Login to admin**: http://127.0.0.1:8000/admin/

---

## Important Notes

✅ **Database**: Using Supabase (Transaction mode - handles many connections)  
✅ **Connection Pooling**: Configured to close connections after each request  
✅ **Email**: Configured with SMTP (Gmail)  
⚠️ **Security**: Change SECRET_KEY before deploying to production!  

