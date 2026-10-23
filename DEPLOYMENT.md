# 🚀 Free Deployment Guide for Bike for U

This guide walks you through deploying **Bike for U** on **100% free hosting platforms** with zero credit card required.

---

## 🥇 Method 1: Render.com (Recommended — 100% Free & Docker Native)

Render is the best free option for this project because:
1. It runs our **`Dockerfile` directly**, meaning **headless Chromium and 9-page PDF generation work out of the box** without serverless size limits.
2. It includes a **Free PostgreSQL Database**.
3. We have provided a [`render.yaml`](./render.yaml) blueprint file, which sets up both the database and the web application automatically with one click!

### Step 1: Push your code to GitHub
If you haven't already pushed this repository to GitHub:
1. Go to [GitHub.com](https://github.com/new) and create a new repository called `Bike4U` (Public or Private).
2. In your terminal, run:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/Bike4U.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render via Blueprint
1. Go to [Render.com](https://render.com) and sign up / log in with your GitHub account.
2. In the Render Dashboard, click **New +** in the top right and select **Blueprint**.
3. Select your `Bike4U` repository.
4. Render will read the [`render.yaml`](./render.yaml) file automatically:
   - It will configure the **`bike4u-app`** Web Service (Docker runtime).
   - It will configure the **`bike4u-db`** PostgreSQL 16 Free Database.
   - It will automatically connect `DATABASE_URL` between them.
5. Click **Apply**.
6. Render will:
   - Spin up your PostgreSQL database.
   - Build your Docker container with Chromium & Next.js.
   - Run `prisma db push` and seed all 26 two-wheelers automatically.
   - Provide a free HTTPS URL like: `https://bike4u-app.onrender.com`.

---

## 🥈 Method 2: Koyeb (100% Free Tier — Docker Native)

Koyeb is another modern cloud platform that provides a free nano instance with native Docker deployment:

1. Push your code to GitHub.
2. Go to [Koyeb.com](https://www.koyeb.com) and sign in with GitHub.
3. Click **Create App** → Select **GitHub**.
4. Choose your `Bike4U` repository.
5. Under **Builder**, select **Dockerfile**.
6. Under **Environment variables**, add:
   - `DATABASE_URL`: Your PostgreSQL connection string (from Koyeb Free Postgres, Neon, or Supabase).
   - `DISABLE_REDIS`: `true`
   - `NODE_ENV`: `production`
7. Click **Deploy**. Your app will be live at `https://<your-app>.koyeb.app`.

---

## 🥉 Method 3: Vercel + Neon Postgres (Serverless)

If you prefer Vercel:

1. Create a free serverless PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Copy your PostgreSQL connection string.
3. Import your GitHub repository to [Vercel](https://vercel.com).
4. In Vercel Environment Variables, add:
   - `DATABASE_URL`: `postgresql://...` (your Neon connection string)
   - `DISABLE_REDIS`: `true`
5. Deploy!
*(Note: For PDF generation on Vercel's 50MB function limit, Render or Koyeb using Docker is recommended so the Chromium binary is pre-packaged).*

---

## 🔍 Verifying Your Live Deployment

Once deployed, visit your assigned URL:
- **Web App:** `https://your-app.onrender.com`
- **Health Check:** `https://your-app.onrender.com/api/health`
- **Admin CMS:** `https://your-app.onrender.com/admin`
- **Sample Recommendation:** Fill out the 5 questions and test downloading the showroom PDF!
