# Quick Start Scripts

These batch scripts simplify your development workflow by automating repetitive tasks.

## 📋 Available Scripts

### 🔧 `setup.bat` - First Time Setup
**Run this ONCE when setting up the project**

What it does:
- Creates Python virtual environment
- Installs all dependencies from `requirements.txt`
- Runs database migrations

```bash
# Double-click or run:
setup.bat
```

---

### ▶️ `run.bat` - Start Development Server
**Use this EVERY TIME you want to run the project**

What it does:
- Activates virtual environment automatically
- Starts Django development server at http://127.0.0.1:8000

```bash
# Double-click or run:
run.bat
```

**No more manual activation or pip install needed!** 🎉

---

### 📦 `update.bat` - Update Dependencies
**Run when `requirements.txt` changes**

What it does:
- Activates virtual environment
- Updates pip to latest version
- Installs/updates all dependencies

```bash
# Double-click or run:
update.bat
```

---

### 🗄️ `migrate.bat` - Database Migrations
**Run when models change**

What it does:
- Activates virtual environment
- Creates new migrations (`makemigrations`)
- Applies migrations (`migrate`)

```bash
# Double-click or run:
migrate.bat
```

---

### 🐚 `shell.bat` - Django Shell
**Quick access to Django shell**

What it does:
- Activates virtual environment
- Opens Django interactive shell

```bash
# Double-click or run:
shell.bat
```

---

## 🚀 Typical Workflow

### **First time:**
1. Run `setup.bat` (only once)

### **Daily development:**
1. Run `run.bat` to start server
2. Code your changes
3. Press `CTRL+C` to stop server

### **When you pull changes:**
1. Run `update.bat` (if `requirements.txt` changed)
2. Run `migrate.bat` (if models changed)
3. Run `run.bat` to start server

---

## ⚡ Benefits

✅ **No more typing the same commands**  
✅ **No manual venv activation needed**  
✅ **No forgetting to install dependencies**  
✅ **One-click development server start**  
✅ **Consistent environment across team**

---

## 🛠️ Manual Commands (if needed)

If you still need to run manual commands:

```bash
# Activate venv manually
..\venv\Scripts\activate

# Deactivate venv
deactivate
```

---

## 📝 Notes

- Virtual environment is created in `../venv` (one level up from project)
- All scripts automatically activate/deactivate the venv
- Scripts work from the `evalmate` directory (where `manage.py` is)
- Run from Command Prompt or PowerShell (not Git Bash)
