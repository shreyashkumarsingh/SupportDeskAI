# 🔐 Environment Variables Reference

Quick reference for all environment variables needed for deployment.

## 📍 Where to Set These

- **Local Development**: `.env` files (backend) and `.env.local` (frontend)
- **Render Deployment**: Service settings → Environment tab

---

## 🐍 Backend Environment Variables

### Required

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `ENVIRONMENT` | Deployment environment | `production` | Manual |
| `PORT` | Server port (auto-set by Render) | `8000` | Render auto-fills |
| `MODEL_VERSION` | ML model version | `2.1.0` | Manual |

### Optional (Supabase)

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_KEY` | Service role key | `eyJhbGc...` | Supabase Dashboard → Settings → API |

### Auto-Configured (Render)

| Variable | Description | Auto-Set Value |
|----------|-------------|----------------|
| `ALLOWED_ORIGINS` | Frontend CORS origins | `https://your-frontend.onrender.com` |

---

## ⚛️ Frontend Environment Variables

### Required

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `VITE_API_BASE_URL` | Backend API URL | `https://your-backend.onrender.com` | Render backend service URL |
| `VITE_APP_NAME` | Application name | `SupportDesk AI` | Manual |
| `VITE_APP_VERSION` | App version | `2.0.0` | Manual |

### Authentication

| Variable | Description | Value |
|----------|-------------|-------|
| `VITE_USE_MOCK_AUTH` | Use mock authentication | `false` (production) / `true` (dev) |

### Optional (Supabase)

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Anonymous/public key | `eyJhbGc...` | Supabase Dashboard → Settings → API (anon public) |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ENABLE_ANALYTICS` | Enable analytics page | `true` |
| `VITE_ENABLE_EXPLANATIONS` | Show prediction explanations | `true` |

---

## 📋 Quick Setup Templates

### Development (.env files)

**backend/.env**
```env
ENVIRONMENT=development
PORT=8000
MODEL_VERSION=2.1.0
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ALLOWED_ORIGINS=
```

**frontend/.env.local**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_AUTH=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_APP_NAME=SupportDesk AI
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_EXPLANATIONS=true
```

### Production (Render Dashboard)

**Backend Service:**
```
ENVIRONMENT=production
MODEL_VERSION=2.1.0
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://supportdesk-ai-frontend.onrender.com
```

**Frontend Service:**
```
VITE_API_BASE_URL=https://supportdesk-ai-backend.onrender.com
VITE_USE_MOCK_AUTH=false
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_APP_NAME=SupportDesk AI
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_EXPLANATIONS=true
```

---

## 🔑 Getting Supabase Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL**: Use for both `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon public**: Use for `VITE_SUPABASE_ANON_KEY` (frontend)
   - **service_role**: Use for `SUPABASE_SERVICE_KEY` (backend)

⚠️ **Security Note**: 
- ✅ `anon public` key is safe to expose in frontend
- ❌ `service_role` key must NEVER be in frontend code
- ❌ Never commit `.env` files to Git

---

## 🔄 Update Process

When you need to change a variable:

1. **Render Dashboard**
   - Go to service settings
   - Click "Environment" tab
   - Edit or add variable
   - Click "Save Changes"
   - Service auto-restarts

2. **Local Development**
   - Edit `.env` or `.env.local`
   - Restart server/frontend
   - Changes take effect immediately

---

## ✅ Verification

After setting variables, test:

**Backend:**
```bash
curl https://your-backend.onrender.com/health
```
Should return: `{"status":"healthy",...}`

**Frontend:**
Open browser console (F12) and check for:
- ✅ No CORS errors
- ✅ API calls succeed
- ✅ No "undefined" environment variables

---

## 🆘 Troubleshooting

### Backend can't connect to Supabase
- Check `SUPABASE_URL` format (includes `https://`)
- Verify `SUPABASE_SERVICE_KEY` is service_role, not anon
- Test key in Supabase SQL editor

### Frontend shows API errors
- Verify `VITE_API_BASE_URL` matches backend URL exactly
- Check for trailing slashes (remove them)
- Ensure backend `ALLOWED_ORIGINS` includes frontend URL

### CORS errors in browser
- Backend `ALLOWED_ORIGINS` must match frontend URL
- No wildcards (`*`) in production
- Check protocol (http vs https)

### Environment variables not loading
- Vite requires `VITE_` prefix for frontend vars
- Restart after changes
- In Render, trigger manual deploy after env changes

---

## 📞 Need Help?

- Check [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for full guide
- Review [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- See [Render Docs](https://render.com/docs/environment-variables)
