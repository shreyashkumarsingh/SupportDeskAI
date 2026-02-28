# 🚀 Render Deployment Guide

This guide walks you through deploying the SupportDesk AI application to Render.

## 📋 Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Supabase Account** (Optional): For production authentication and database

## 🎯 Deployment Methods

### Option 1: Automatic Deployment (Recommended)

Use the `render.yaml` blueprint file for automatic deployment of both services.

#### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create New Blueprint in Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically
   - Click **"Apply"**

3. **Configure Environment Variables**
   
   After blueprint is applied, configure secrets in each service:
   
   **Backend Service:**
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `ALLOWED_ORIGINS`: Will auto-populate from frontend URL
   
   **Frontend Service:**
   - `VITE_SUPABASE_URL`: Your Supabase project URL  
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `VITE_API_BASE_URL`: Will auto-populate from backend URL

4. **Wait for Build**
   - Backend (Python): ~5-10 minutes
   - Frontend (Node+Vite): ~3-5 minutes

5. **Access Your App**
   - Frontend URL: `https://supportdesk-ai-frontend.onrender.com`
   - Backend API: `https://supportdesk-ai-backend.onrender.com`

---

### Option 2: Manual Deployment

Deploy services individually if you prefer manual control.

#### Backend Deployment

1. **Create Web Service**
   - Dashboard → **"New +"** → **"Web Service"**
   - Connect repository
   - Select `backend` folder as root directory

2. **Configure Build Settings**
   - **Name**: `supportdesk-ai-backend`
   - **Runtime**: Python 3
   - **Build Command**: 
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```bash
     uvicorn src.api.app:app --host 0.0.0.0 --port $PORT
     ```

3. **Set Environment Variables**
   ```
   ENVIRONMENT=production
   MODEL_VERSION=2.1.0
   PORT=8000
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_KEY=<your-service-key>
   ALLOWED_ORIGINS=<will-add-frontend-url-later>
   ```

4. **Advanced Settings**
   - **Health Check Path**: `/health`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free

#### Frontend Deployment

1. **Create Static Site**
   - Dashboard → **"New +"** → **"Static Site"**
   - Connect repository
   - Select `frontend` folder as root directory

2. **Configure Build Settings**
   - **Name**: `supportdesk-ai-frontend`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`

3. **Set Environment Variables**
   ```
   VITE_API_BASE_URL=<your-backend-url-from-step-1>
   VITE_USE_MOCK_AUTH=false
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_APP_NAME=SupportDesk AI
   VITE_APP_VERSION=2.0.0
   ```

4. **Configure Redirects/Rewrites** (for SPA routing)
   - Add rewrite rule: `/*` → `/index.html`

5. **Update Backend CORS**
   - Go back to backend service
   - Update `ALLOWED_ORIGINS` with your frontend URL:
     ```
     ALLOWED_ORIGINS=https://supportdesk-ai-frontend.onrender.com
     ```

---

## 🔐 Supabase Setup (Optional)

If using Supabase for authentication and data persistence:

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for database to provision (~2 minutes)

2. **Get API Credentials**
   - Go to **Settings** → **API**
   - Copy:
     - Project URL (for `SUPABASE_URL`)
     - `anon/public` key (for frontend `VITE_SUPABASE_ANON_KEY`)
     - `service_role` key (for backend `SUPABASE_SERVICE_KEY`)

3. **Create Tables** (if needed)
   ```sql
   -- Example: History table
   CREATE TABLE history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id TEXT NOT NULL,
     subject TEXT NOT NULL,
     body TEXT NOT NULL,
     predicted_category TEXT NOT NULL,
     confidence FLOAT NOT NULL,
     request_id TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend health endpoint responds: `https://your-backend.onrender.com/health`
- [ ] Frontend loads correctly: `https://your-frontend.onrender.com`
- [ ] Can make predictions from the dashboard
- [ ] CORS is working (no errors in browser console)
- [ ] Accept/Override buttons work for feedback
- [ ] History is saved (if using Supabase)

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check build logs for Python errors
- Ensure `requirements.txt` has all dependencies
- Verify `src/api/app.py` path is correct
- Check ML model files exist in `backend/models/`

### Frontend Shows API Errors
- Verify `VITE_API_BASE_URL` points to backend URL
- Check backend CORS `ALLOWED_ORIGINS` includes frontend URL
- Ensure backend is running (green status in Render)

### CORS Errors
- Backend `ALLOWED_ORIGINS` must include frontend URL
- Don't use `*` with `allow_credentials=True`
- Format: `https://your-frontend.onrender.com` (no trailing slash)

### 502 Bad Gateway
- Backend might be sleeping (free tier sleeps after 15min inactivity)
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading to paid tier for persistent instances

---

## 💰 Render Free Tier Limits

- **Web Services**: 750 hours/month (enough for 1 backend)
- **Static Sites**: Unlimited bandwidth
- **Sleeping**: Services sleep after 15 minutes of inactivity
- **Build Time**: Generous limits for both services

---

## 🚀 Next Steps

1. **Custom Domain** (Optional)
   - Go to service settings
   - Add custom domain
   - Update DNS records

2. **Environment-Specific Configs**
   - Create staging environment
   - Use separate Supabase projects for dev/prod

3. **Monitoring**
   - Enable email alerts for deployment failures
   - Monitor backend `/health` endpoint
   - Check logs regularly

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Project Issues**: Create GitHub issue

---

## 🎉 Success!

Your SupportDesk AI app is now live on Render! Share the frontend URL with users.

**Example URLs:**
- Frontend: `https://supportdesk-ai-frontend.onrender.com`
- Backend API: `https://supportdesk-ai-backend.onrender.com`
- Health Check: `https://supportdesk-ai-backend.onrender.com/health`
