# 📝 Pre-Deployment Checklist

Before deploying to Render, complete these steps:

## ✅ Code Repository

- [ ] All changes committed to Git
- [ ] Pushed to GitHub main branch
- [ ] No sensitive data in code (API keys, passwords)
- [ ] `.env` files are in `.gitignore`
- [ ] `render.yaml` is in repository root

## ✅ Backend Verification

- [ ] ML model files exist in `backend/models/`:
  - `ticket_model.pkl`
  - `tfidf_vectorizer.pkl`
- [ ] `requirements.txt` is up to date
- [ ] Backend runs locally: `cd backend && uvicorn src.api.app:app`
- [ ] Health endpoint works: `http://localhost:8000/health`
- [ ] CORS configuration updated for production
- [ ] Environment variables documented in `.env.example`

## ✅ Frontend Verification

- [ ] Frontend builds successfully: `npm run build`
- [ ] Production build tested: `npm run preview`
- [ ] API base URL uses environment variable
- [ ] All environment variables in `.env.example`
- [ ] No hardcoded localhost URLs in code

## ✅ Supabase Setup (If Using)

- [ ] Supabase project created
- [ ] Database tables created (if needed)
- [ ] API keys copied
- [ ] Row Level Security configured (if needed)

## ✅ Render Account

- [ ] Render account created and verified
- [ ] GitHub account connected to Render
- [ ] Payment method added (even for free tier)

## ✅ Environment Variables Ready

**Backend:**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `ALLOWED_ORIGINS` (frontend URL)
- [ ] `ENVIRONMENT=production`
- [ ] `MODEL_VERSION=2.1.0`

**Frontend:**
- [ ] `VITE_API_BASE_URL` (backend URL)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_USE_MOCK_AUTH=false`

## 🚀 Deployment Steps

1. **Initial Deployment**
   - [ ] Create Blueprint in Render
   - [ ] Connect GitHub repository
   - [ ] Apply render.yaml
   - [ ] Wait for initial build

2. **Configure Backend**
   - [ ] Add Supabase environment variables
   - [ ] Note backend URL
   - [ ] Verify health endpoint responds

3. **Configure Frontend**
   - [ ] Add backend URL to `VITE_API_BASE_URL`
   - [ ] Add Supabase variables
   - [ ] Trigger rebuild

4. **Update CORS**
   - [ ] Go to backend service
   - [ ] Update `ALLOWED_ORIGINS` with frontend URL
   - [ ] Service will auto-restart

5. **Testing**
   - [ ] Open frontend URL
   - [ ] Test login/signup
   - [ ] Make a prediction
   - [ ] Test Accept/Override buttons
   - [ ] Check browser console for errors
   - [ ] Verify history saves

## ⏱️ Expected Timeline

- Initial blueprint setup: **2 minutes**
- Backend build: **5-10 minutes**
- Frontend build: **3-5 minutes**
- Environment variable configuration: **5 minutes**
- Testing: **10 minutes**
- **Total: ~30 minutes**

## 🐛 Common Issues

### Backend Build Fails
- Check Python version compatibility
- Review build logs for missing dependencies
- Ensure model files are committed to Git

### Frontend Build Fails
- Check Node version (should be 18+)
- Clear npm cache: `npm cache clean --force`
- Check for TypeScript errors locally first

### 502 Bad Gateway
- Backend is starting up (wait 30 seconds)
- Check backend logs for errors
- Verify health endpoint responds

### CORS Errors
- Frontend URL not in backend `ALLOWED_ORIGINS`
- Check exact URL (no trailing slash)
- Verify HTTPS vs HTTP

### Authentication Not Working
- Supabase variables not set correctly
- Check Supabase project status
- Verify anon key vs service key usage

## 📋 Post-Deployment

- [ ] Test all features end-to-end
- [ ] Set up monitoring/alerts
- [ ] Document production URLs
- [ ] Share with stakeholders
- [ ] Monitor logs for first 24 hours

## 🎉 Ready to Deploy!

Once all checkboxes are complete, proceed with deployment following `RENDER_DEPLOYMENT.md`.
