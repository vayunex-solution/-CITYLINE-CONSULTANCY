# CITYLINE CONSULTANCY — Production cPanel Deployment & Node.js Setup Guide

This guide provides the complete, authoritative operational instructions for deploying and running the **CITYLINE CONSULTANCY** platform on cPanel hosting.

---

## 1. Production Architecture Overview

As configured in your cPanel Domains Manager:

| Domain | Document Root | Role | Technology Stack |
| :--- | :--- | :--- | :--- |
| **`citylineconsultancy.com`** *(Main Domain)* | `/public_html` | Client Web Portal & App Shell | Next.js 14 Static Export (`frontend/out/`) served by Apache/LiteSpeed |
| **`api.citylineconsultancy.com`** *(Subdomain)* | `/api.citylineconsultancy.com` | REST API Engine & Database Service | Node.js 18+/20+ (Express, Knex, MariaDB/MySQL) |

---

## 2. cPanel Git Versioning Setup (Automated UI Deployment)

cPanel Git Versioning uses the root [`.cpanel.yml`](file:///d:/VAYUNEX/vayu-backup/CLC-Website/.cpanel.yml) file to automate deployments directly into `/public_html`.

### Step 2.1: Clone the Repository in cPanel
1. Log in to your **cPanel Dashboard**.
2. Under the **Files** section, click **Git™ Versioning**.
3. Click the blue **Create** button.
4. Fill in the repository details:
   - **Clone a Repository**: Toggle to **ON**.
   - **Clone URL**: `https://github.com/vayunex-solution/-CITYLINE-CONSULTANCY.git` (or your SSH URL).
   - **Repository Path**: `repositories/clc-website` (creates `/home/username/repositories/clc-website`).
   - **Repository Name**: `clc-website`.
5. Click **Create**. cPanel will clone the repository.

### Step 2.2: How the Deployment Works (`.cpanel.yml`)
When you click **Deploy HEAD Commit** in cPanel, cPanel executes:
```yaml
deployment:
  tasks:
    - export DEPLOYPATH=${DEPLOYPATH:-$HOME/public_html}
    - /bin/mkdir -p $DEPLOYPATH
    - /bin/cp -R frontend/out/* $DEPLOYPATH/
    - /bin/cp frontend/public_html_htaccess $DEPLOYPATH/.htaccess
    - /bin/find $DEPLOYPATH -type d -exec chmod 755 {} +
    - /bin/find $DEPLOYPATH -type f -exec chmod 644 {} +
```
- **Only UI files are deployed**: Only the precompiled static files from `frontend/out/` are copied to `/public_html`.
- **Apache `.htaccess` is activated**: Clean URLs, HTTPS redirect, and API proxy rules are automatically placed in `/public_html/.htaccess`.
- **Permissions are locked**: Directories receive `755` and files receive `644`, preventing 403 Forbidden errors.

### Step 2.3: Daily Development & Update Workflow
Whenever you make updates on your computer:
```bash
# 1. Generate fresh static UI build locally
npm run build:cpanel

# 2. Commit and push everything to Git
git add .
git commit -m "feat(deploy): update website build"
git push origin main
```
Then in cPanel:
1. Go to **Git™ Versioning** &rarr; click **Manage** next to `clc-website`.
2. Go to the **Pull or Deploy** tab.
3. Click **Update from Remote** (pulls latest code from GitHub).
4. Click **Deploy HEAD Commit** (deploys `frontend/out/*` to `/public_html` in 2 seconds).

---

## 3. cPanel "Setup Node.js App" Configuration (`api.citylineconsultancy.com`)

The backend REST API is hosted on the subdomain `api.citylineconsultancy.com`.

### Step 3.1: Copy Backend Files to the Subdomain Root
In cPanel File Manager or via Git clone/symlink:
Place the repository files (specifically `backend/` and `shared/`) into:
`/home/username/api.citylineconsultancy.com`

Structure inside `/home/username/api.citylineconsultancy.com`:
```
api.citylineconsultancy.com/
├── app.js               <-- Startup wrapper
├── package.json         <-- Backend dependencies
├── .env                 <-- Production secrets
├── dist/                <-- Pre-compiled JavaScript engine
│   ├── server.js
│   ├── app.js
│   └── ...
└── ...
```

### Step 3.2: Create the Node.js Application in cPanel
1. In cPanel Dashboard, search for and click **Setup Node.js App** (under Software section).
2. Click **Create Application**.
3. Configure the following fields:
   - **Node.js version**: Choose `18.x` or `20.x` (LTS recommended).
   - **Application mode**: Select **Production**.
   - **Application root**: `api.citylineconsultancy.com` (or the folder path relative to your home directory).
   - **Application URL**: Select `api.citylineconsultancy.com`.
   - **Application startup file**: `app.js` (uses the pre-configured [backend/app.js](file:///d:/VAYUNEX/vayu-backup/CLC-Website/backend/app.js) wrapper).
4. Click **Create** (top right).

### Step 3.3: Configure Production Environment Variables
Under the **Environment variables** section in the Node.js App screen (or in a `.env` file in the application root), set:

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
API_PREFIX=/api/v1
CORS_ORIGIN=https://citylineconsultancy.com

# Database Connection (from cPanel MySQL Databases)
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=username_clc_db
DB_USER=username_clc_user
DB_PASSWORD=your_strong_password_here

# Security Secrets
JWT_SECRET=generate_a_64_character_hex_secret_here
ADMIN_INVITE_SECRET=generate_another_secret_here

# File Upload Storage
STORAGE_LOCAL_ROOT=/home/username/clc_storage
```

### Step 3.4: Install Production Dependencies & Run
1. In the **Setup Node.js App** interface, click **Run NPM Install**.
2. Once installed, click **Restart Application**.
3. Test by opening your browser to:
   `https://api.citylineconsultancy.com/api/v1/health`
   You should see:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "timestamp": "2026-09-16T...",
       "environment": "production"
     }
   }
   ```

---

## 4. cPanel MariaDB / MySQL Setup

1. In cPanel Dashboard, open **MySQL® Databases**.
2. **Create New Database**: e.g., `username_clc_db`.
3. **Add New User**: e.g., `username_clc_user` with a strong password.
4. **Add User To Database**: Select the user and database &rarr; click **Add** &rarr; check **ALL PRIVILEGES** &rarr; click **Make Changes**.
5. Update `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in your Node.js app environment.

### Run Database Migrations on cPanel
From cPanel Terminal or SSH:
```bash
cd /home/username/api.citylineconsultancy.com
npx knex --knexfile dist/config/knex.config.js migrate:latest
```

---

## 5. Summary Checklist

- [x] UI Build exported via `npm run build:cpanel` (all 45 static pages verified).
- [x] Apache `.htaccess` injected with HTTPS, SPA clean URLs, and `/api/v1/` proxying.
- [x] `.cpanel.yml` created in repository root targeting `/public_html`.
- [x] `backend/app.js` created for cPanel Phusion Passenger startup.
- [x] `.gitignore` configured to track `frontend/out/**`, `backend/dist/**`, and `shared/dist/**`.
