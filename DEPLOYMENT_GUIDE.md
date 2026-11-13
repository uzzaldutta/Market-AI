# 🚀 100% FREE Web Deployment Guide for Bharat Market AI

This guide shows you how to publish **Bharat Market AI** online to the web so anyone can access and use it from any device (laptop, tablet, phone) **100% FREE** with **zero hosting fees**.

---

## 🏗️ Architecture Overview

| Component | Free Hosting Provider | Free Tier Limits | Cost |
|---|---|---|---|
| **Frontend Web App** | **Vercel** (`vercel.com`) | Unlimited fast CDN bandwidth, 100% free | **₹0 (Free Forever)** |
| **Backend API Server** | **Render** (`render.com`) | Free Web Service (Python/FastAPI) | **₹0 (Free Forever)** |

---

## 📋 Step-by-Step Instructions

### Step 1: Push Your Code to GitHub (Free)

1. Open your browser and go to [github.com](https://github.com) (sign in or create a free account).
2. Click **"+"** (top-right) -> **"New repository"**.
3. Name it: `bharat-market-ai`.
4. Choose **Public** or **Private** (both are 100% free). Leave all other checkboxes unchecked.
5. Click **"Create repository"**.
6. On your computer, open PowerShell or Terminal in `bharat-market-ai` folder and run:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/bharat-market-ai.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Deploy the Backend API on Render.com (100% Free)

1. Go to [render.com](https://render.com) and sign up/log in with your GitHub account.
2. In the Render Dashboard, click **"New +"** -> **"Web Service"**.
3. Select **"Build and deploy from a Git repository"** and choose `bharat-market-ai`.
4. Configure these fields:
   - **Name**: `bharat-market-api`
   - **Region**: Singapore or Frankfurt (Singapore has the lowest latency to India NSE)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Select **"Free"** ($0/month)
5. Click **"Create Web Service"**.
6. Render will build and deploy your API in ~2 minutes. Once finished, it will give you a free live HTTPS URL, for example:
   ```
   https://bharat-market-api.onrender.com
   ```
   *(Test it in your browser: `https://bharat-market-api.onrender.com/api/v1/health` should display `{"status":"HEALTHY"}`)*.

---

### Step 3: Deploy the Frontend on Vercel (100% Free)

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **"Add New..."** -> **"Project"**.
3. Select your `bharat-market-ai` GitHub repository and click **"Import"**.
4. In the Project Configuration:
   - **Framework Preset**: `Next.js` (auto-detected)
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Environment Variables**:
     - Key: `NEXT_PUBLIC_API_URL`
     - Value: `https://bharat-market-api.onrender.com/api/v1` *(replace with your actual Render URL from Step 2)*
5. Click **"Deploy"**.
6. In about 60 seconds, your site will be live! Vercel will give you a public URL such as:
   ```
   https://bharat-market-ai.vercel.app
   ```

---

## ⚡ Instant 1-Minute Web Link (Alternative: Cloudflare Tunnel / LocalTunnel)

If you want a live public web link **right now** without setting up GitHub or cloud accounts, you can expose your local running app to the internet with **Localtunnel** (100% free, no signup required):

1. Open PowerShell and run:
   ```powershell
   npx localtunnel --port 3001
   ```
2. Localtunnel will instantly output a public web link:
   ```
   your url is: https://brave-fox-42.loca.lt
   ```
3. Share that link with anyone in the world — they will be able to access your full live application directly from their phone or laptop!

---

## 💡 Tips for Keeping It Free

1. **Render Free Tier Sleep Mode**: Free Render services go to sleep after 15 minutes of inactivity and take ~30 seconds to wake up on the first visit. You can use free ping tools like [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com) to ping your `/api/v1/health` URL every 10 minutes so it stays awake 24/7.
2. **Custom Domain**: Both Vercel and Render allow connecting your own custom domain (e.g. `www.mybharatmarket.in`) completely free of charge.
