# SpendWise — Smart & Beautiful Expense Tracker 💸✨

SpendWise is a modern, high-performance personal finance and expense tracker built with **Next.js (App Router)**, **Tailwind CSS**, **Drizzle ORM**, and **PostgreSQL**.

---

## 🌟 Features

- 🎨 **Modern & Vibrant Interface**: Sleek glassmorphic dashboard, responsive layout, custom color palettes for categories, and dynamic **Light / Dark mode** toggle.
- 🔐 **Secure Authentication**: Server-side JWT cookie authentication with `bcryptjs` password hashing and multi-tenant security isolation.
- 💰 **Precise Currency & Money Engine**:
  - Currency per account (USD, EUR, GBP, CAD, AUD, JPY, INR, AED).
  - All financial amounts are stored as **integer minor units (cents)** in PostgreSQL to avoid floating-point inaccuracies.
- 📊 **Visual Analytics & Charts**:
  - **Category Breakdown Donut Chart**: Interactive category distribution with custom colors and percentage progress bars.
  - **Monthly Trend Bar Chart**: 6-month historical spending comparison.
  - **KPI Metric Cards**: This Month's Spend, Top Category, All-Time Total, Average per transaction.
- ⚡ **Rapid Expense Management**:
  - **Quick Add Bar**: Log an expense in under 5 seconds directly from the top bar.
  - **Expense Modal**: Full-featured Add/Edit modal with category picker, date picker, amount validation, and optional notes.
  - **Filter & Search**: Filter by month, filter by category tabs, and live text search across notes and merchants.
- 📱 **Mobile-First Responsive**: Seamless navigation and touch-optimized card layout on smartphones and tablets.

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher (v20+ recommended)
- [npm](https://www.npmjs.com/)

### 1. Installation
```bash
git clone <your-repo-url>
cd "SPEND TRACKER"
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env.local
```

Default variables:
```env
# PostgreSQL connection string
# Defaults to zero-config embedded PGlite locally, or your PostgreSQL instance
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spendwise"

# Secret key for encrypting session cookies
AUTH_SECRET="spendwise_super_secret_jwt_encryption_key_2026_production"
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🔑 Demo Accounts
The database automatically seeds two test accounts:
1. **Alex Morgan (USD)**: `alex@spendwise.app` / `password123`
2. **Sarah Dubois (EUR)**: `sarah@spendwise.app` / `password123`

---

## ☁️ Deploying to Railway

Deploying SpendWise to [Railway](https://railway.app) takes less than 3 minutes:

### Option A: Railway Web Dashboard (One-Click)
1. Log in to [Railway](https://railway.app).
2. Click **New Project** $\rightarrow$ **Provision PostgreSQL**.
3. In the same project, click **New** $\rightarrow$ **GitHub Repo** $\rightarrow$ select your SpendWise repository.
4. In your Web Service settings:
   - Go to the **Variables** tab.
   - Click **Add Reference** and select `DATABASE_URL` from your PostgreSQL service.
   - Add a custom variable `AUTH_SECRET` with any secure 32+ character random string (e.g. `openssl rand -base64 32`).
5. Railway will automatically build using the included `railway.json` / `Dockerfile` and deploy the database and web app!
6. Click **Generate Domain** in the **Settings** tab to access your live production URL.

### Option B: Railway CLI
```bash
# Install Railway CLI if not installed
npm i -g @railway/cli

# Login and link project
railway login
railway init

# Add PostgreSQL plugin
railway add --plugin postgresql

# Deploy
railway up
```

---

## 🗄️ Database Schema & Drizzle ORM

### Tables
- **`users`**:
  - `id`: UUID (Primary Key)
  - `name`: VARCHAR(255)
  - `email`: VARCHAR(255) Unique
  - `password_hash`: VARCHAR(255)
  - `currency`: VARCHAR(10) Default `'USD'`
  - `created_at`, `updated_at`: TIMESTAMPTZ

- **`expenses`**:
  - `id`: UUID (Primary Key)
  - `user_id`: UUID (Foreign Key $\rightarrow$ `users.id` with `CASCADE` delete)
  - `amount`: INTEGER (Stored as minor units / cents)
  - `category`: VARCHAR(50) (Indexed)
  - `date`: TIMESTAMPTZ (Indexed)
  - `note`: TEXT
  - `created_at`, `updated_at`: TIMESTAMPTZ

### Migration Commands
```bash
# Generate Drizzle migration files
npm run db:generate

# Execute migrations on PostgreSQL
npm run db:migrate

# Seed database with realistic demo records
npm run db:seed
```

---

## 🛡️ Tenant Security & Isolation
- Every server action queries the session from encrypted HTTP-only cookies.
- Queries strictly enforce `eq(expenses.userId, session.userId)` across select, insert, update, and delete actions. Users can never view or manipulate other users' data.

---

## 👥 Built by the Agent Team
- **Agent 1 (Design & App)**: UI/UX, responsive components, charts, light/dark mode, and modals.
- **Agent 2 (Database & Backend)**: Drizzle ORM schema, migrations, server actions, authentication, and tenant isolation.
- **Agent 3 (Testing & Deployment)**: End-to-end flow validation, Railway setup artifacts, and documentation.
