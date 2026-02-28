# 🚀 Quick Start Guide - Windows

This guide will help you get SupportDesk AI running on Windows in 10 minutes.

## Prerequisites

- **Python 3.10+**: [Download from python.org](https://www.python.org/downloads/)
- **Node.js 20+**: [Download from nodejs.org](https://nodejs.org/)
- **Git**: [Download from git-scm.com](https://git-scm.com/download/win)
- **Docker** (Optional): [Download Docker Desktop](https://www.docker.com/products/docker-desktop)

> ✅ **Tip**: During Python installation, check the box "Add Python to PATH"

---

## 1️⃣ Setup Backend

### Step 1: Navigate to Backend
```powershell
cd backend
```

### Step 2: Create Virtual Environment
```powershell
python -m venv .venv
```

### Step 3: Activate Virtual Environment
```powershell
# For PowerShell:
.\.venv\Scripts\Activate.ps1

# For Command Prompt:
.venv\Scripts\activate.bat
```

> 💡 **Note**: You should see `(.venv)` prefix in your terminal

### Step 4: Install Dependencies
```powershell
pip install -r requirements.txt
```

> ⏳ This may take 5-10 minutes on first install

### Step 5: Download NLP Data
```powershell
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"
```

### Step 6: Create Environment File
```powershell
copy .env.example .env
```

Then edit `.env` with your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
```

> 🔑 Get these from Supabase dashboard: Settings → API

### Step 7: Run Backend
```powershell
uvicorn src.api.app:app --reload --port 8000
```

✅ **Backend Ready!** Open: http://localhost:8000/docs

---

## 2️⃣ Setup Frontend (New Terminal)

### Step 1: Open New PowerShell Window
```powershell
# Keep previous terminal open with backend running
```

### Step 2: Navigate to Frontend
```powershell
cd frontend
```

### Step 3: Install Dependencies
```powershell
npm install
```

> ⏳ May take 2-3 minutes

### Step 4: Create Environment File
```powershell
copy .env.example .env.local
```

Edit `.env.local`:
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Run Frontend
```powershell
npm run dev
```

✅ **Frontend Ready!** Open: http://localhost:5173

---

## ✨ Test the System

### Get a Prediction
```powershell
# Open another terminal and run:
curl -X POST "http://localhost:8000/predict" `
  -H "Content-Type: application/json" `
  -d '{
    "subject": "Cannot login to account",
    "description": "I am unable to log into my account despite entering correct credentials",
    "user_id": "test_user"
  }'
```

### Check API Documentation
Open in browser: http://localhost:8000/docs

---

## 🧪 Run Tests

```powershell
# In backend directory with venv activated:
pytest tests/ -v --cov=src

# View coverage report
# htmlcov\index.html  (open in browser)
```

---

## 🐛 Troubleshooting

### ❌ Error: `ModuleNotFoundError: No module named 'torch'`
**Solution**: Some NLP models require torch. Install it:
```powershell
pip install torch torchvision torchaudio
```

### ❌ Error: `Port 8000 already in use`
**Solution**: Change the port:
```powershell
uvicorn src.api.app:app --reload --port 8001
```

### ❌ Error: `NLTK data not found`
**Solution**: Download again:
```powershell
python -c "import nltk; nltk.download('all')"
```

### ❌ Error: `npm: command not found`
**Solution**: Node.js not installed. Download from nodejs.org and add to PATH

### ❌ Cannot connect to Supabase
**Solution**: 
1. Check credentials in `.env`
2. Ensure Supabase project is created
3. Test URL accessibility

### ❌ Sentiment analysis slow on first run
**This is normal!** The model downloads on first use (~500MB). Subsequent runs are fast.

---

## 📊 System Architecture

```
Frontend (React)        Backend (FastAPI)       Database (Supabase)
│                       │                       │
├─ Dashboard    ◄──────► ├─ /predict       ◄───► ├─ Users
├─ Analytics    ◄──────► ├─ /stats         ◄───► ├─ History
├─ Monitoring   ◄──────► ├─ /feedback      ◄───► └─ Feedback
└─ History      ◄──────► └─ /model/info
                         
http://localhost:5173   http://localhost:8000
```

---

## 🚀 Docker Setup (Alternative)

### Prerequisites
- Docker Desktop installed

### Run Everything
```powershell
docker-compose up --build
```

This starts:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

Stop with:
```powershell
docker-compose down
```

---

## 📚 Next Steps

1. **Explore API**: http://localhost:8000/docs
2. **View Frontend**: http://localhost:5173
3. **Run Tests**: `pytest tests/ -v`
4. **Read Full Guide**: `README_COMPREHENSIVE.md`
5. **Check Architecture**: `PROJECT_OVERVIEW_FOR_AI.md`

---

## 💡 Tips for Development

### Enable Auto-reload
Both dev servers support hot-reload:
- **Backend**: Changes to `.py` files auto-reload
- **Frontend**: Changes to `.tsx` files auto-reload

### Access Backend Logs
```powershell
# In backend terminal, you'll see:
INFO:uvicorn.error:Application startup complete
[timestamp] - INFO - ✅ Model loaded
```

### Debug Mode
```powershell
# Backend with more verbose logging:
uvicorn src.api.app:app --reload --log-level debug
```

### Database Inspection
Visit Supabase dashboard to view:
- `history` table: prediction history
- `feedback` table: user corrections
- `users` table: registered users

---

## 🎯 Common Tasks

### Add a New Dependency
```powershell
# Backend
pip install new-package
pip freeze > requirements.txt

# Frontend
npm install new-package
# Updates package.json automatically
```

### Run Specific Test
```powershell
pytest tests/test_api.py::TestPredictionEndpoint::test_predict_valid_input -v
```

### Format Code
```powershell
black backend/src
```

### Check Code Quality
```powershell
flake8 backend/src
```

---

## 📝 Project Structure
```
supportDeskAI/
├── backend/                 # Python API
│   ├── src/                # Source code
│   ├── tests/              # Test suite
│   ├── models/             # ML artifacts
│   └── requirements.txt
├── frontend/               # React app
│   ├── src/               # Source code
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml      # Docker setup
└── README_COMPREHENSIVE.md # Full guide
```

---

## ✅ Verification Checklist

After setup, you should have:

- [ ] Backend running at http://localhost:8000
- [ ] Frontend running at http://localhost:5173
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Tests passing: `pytest tests/ --tb=short`
- [ ] Can make predictions via API
- [ ] Frontend displays predictions

---

## 🆘 Still Having Issues?

1. **Check logs**: Look for error messages in terminal
2. **Verify environment**: `python --version`, `node --version`
3. **Recreate venv**: Delete `.venv/`, follow Step 1-3 again
4. **Check ports**: Ensure 8000 and 5173 are free
5. **Update packages**: `pip install --upgrade pip`

---

## 🎉 Ready to Go!

Your SupportDesk AI system is now running! 

**Next**: Explore the code, make predictions, and understand how a production ML system works.

Happy coding! 🚀
