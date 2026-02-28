# 🎯 SupportDesk AI

AI-powered support ticket classification system with human-in-the-loop review, feedback loops, and comprehensive governance features.

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Features

- 🤖 **AI-Powered Classification**: Machine learning model for ticket categorization
- 👥 **Human-in-the-Loop**: Accept or override predictions with feedback
- 📊 **Role-Based Access Control**: Admin, Agent, and Viewer roles
- 📝 **Audit Logging**: Complete audit trail for compliance
- 🔄 **Feedback Loop**: Learn from corrections to improve model
- 📦 **Bulk Upload**: CSV batch processing for multiple tickets
- 🎨 **Modern UI**: React + TypeScript with dark/light themes
- 🔐 **Secure Authentication**: Supabase integration with mock mode for dev
- 📈 **Analytics Dashboard**: Track prediction accuracy and trends

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd supportDeskAI
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # source .venv/bin/activate  # Mac/Linux
   pip install -r requirements.txt
   
   # Copy environment template
   copy .env.example .env  # Windows
   # cp .env.example .env  # Mac/Linux
   
   # Start server
   uvicorn src.api.app:app --reload --port 8000
   ```

3. **Frontend Setup** (new terminal)
   ```bash
   cd frontend
   npm install
   
   # Copy environment template
   copy .env.example .env.local  # Windows
   # cp .env.example .env.local  # Mac/Linux
   
   # Start dev server
   npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:8082
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Test Accounts

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`

**Agent Account:**
- Email: `agent@example.com`
- Password: `agent123`

## 🌐 Deploy to Render

Deploy both frontend and backend to Render with one click!

### Prerequisites
- GitHub account
- Render account (free tier available)
- Supabase account (optional, for production auth)

### Deployment Steps

1. **Pre-Deployment Check**
   ```bash
   python verify-deployment.py
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

3. **Deploy on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Connect your repository
   - Render auto-detects `render.yaml`
   - Click **"Apply"**

4. **Configure Environment Variables**
   - Backend: Add Supabase credentials
   - Frontend: Add API URL and Supabase keys
   - See detailed guide: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

5. **Access Your Live App**
   - URLs provided in Render dashboard
   - Example: `https://supportdesk-ai-frontend.onrender.com`

📖 **Full Documentation**: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)  
✅ **Deployment Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

## 📁 Project Structure

```
supportDeskAI/
├── backend/                 # FastAPI backend
│   ├── src/
│   │   ├── api/            # API endpoints
│   │   ├── models/         # ML models
│   │   └── preprocessing/  # Data preprocessing
│   ├── models/             # Trained model files
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment template
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React contexts
│   │   └── lib/           # Utilities
│   ├── package.json       # Node dependencies
│   └── .env.example       # Environment template
├── render.yaml            # Render deployment config
└── README.md             # This file
```

## 🎮 Usage

### Making Predictions

1. **Navigate to Dashboard**: Login and go to the main dashboard
2. **Enter Ticket Details**: 
   - Subject: Brief title
   - Description: Detailed problem description
3. **Get Prediction**: AI classifies into categories:
   - Incident (system failures)
   - Request (access/feature requests)
   - Problem (recurring issues)
   - Change (configuration changes)

### Human Review

After prediction:
- **Accept**: Confirms prediction is correct
- **Override**: Select correct category from dropdown

Both actions feed back into the system for model improvement.

### Bulk Processing

1. Click **"Upload CSV"** button
2. Format: Two columns - `subject`, `description`
3. System processes all tickets
4. View results summary

## 🔧 Configuration

### Backend Environment Variables

```env
ENVIRONMENT=production
PORT=8000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
ALLOWED_ORIGINS=https://your-frontend-url.com
MODEL_VERSION=2.1.0
```

### Frontend Environment Variables

```env
VITE_API_BASE_URL=https://your-backend-url.com
VITE_USE_MOCK_AUTH=false
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=SupportDesk AI
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E verification
python verify-deployment.py
```

## 📊 Tech Stack

**Backend:**
- FastAPI (Python web framework)
- Scikit-learn (ML classification)
- Supabase (Database & Auth)
- Uvicorn (ASGI server)

**Frontend:**
- React 18 (UI framework)
- TypeScript (Type safety)
- Vite (Build tool)
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- Shadcn/ui (Component library)

**Deployment:**
- Render (Cloud hosting)
- GitHub (Version control)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- 📖 [Full Documentation](README_COMPREHENSIVE.md)
- 🐛 [Report Bug](../../issues)
- 💡 [Request Feature](../../issues)
- 📧 Email: support@supportdesk-ai.com

## 🎉 Acknowledgments

- Built with modern web technologies
- Inspired by enterprise helpdesk systems
- Designed for production deployment

---

**Ready to deploy?** Follow the [Render Deployment Guide](RENDER_DEPLOYMENT.md) 🚀
