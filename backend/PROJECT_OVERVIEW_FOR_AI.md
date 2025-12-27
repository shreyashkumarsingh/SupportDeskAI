# SupportDesk AI - Complete Project Documentation

## Project Overview
A full-stack AI-powered support ticket classification system that automatically categorizes customer support tickets using machine learning. The system consists of a Python FastAPI backend with ML models, a React frontend with authentication, and Supabase for data persistence.

---

## Architecture

### Technology Stack
**Backend:**
- Python 3.10+ with FastAPI
- Machine Learning: scikit-learn with SVM classifier
- Text Processing: TF-IDF vectorization with custom text cleaning
- Database: Supabase (PostgreSQL + Auth)
- Server: Uvicorn ASGI server

**Frontend:**
- React 19.2.0 with React Router
- UI: Tailwind CSS for styling
- State Management: React Context API for authentication
- Charts: Chart.js with react-chartjs-2
- HTTP Client: Axios
- Auth: Supabase client SDK

**Development Tools:**
- Jupyter Notebooks for EDA and model training
- Python venv for dependency isolation
- npm/node for frontend package management

---

## Project Structure

```
supportDeskAI/
├── data/
│   ├── raw/
│   │   └── tickets.csv              # Original ticket dataset (28k+ rows)
│   └── processed/
│       └── clean_tickets.csv        # Cleaned dataset
│
├── notebooks/
│   ├── 01_eda.ipynb                 # Exploratory Data Analysis
│   ├── 02_model.ipynb               # Model training and evaluation
│   └── data/processed/              # Notebook data copy
│
├── models/
│   ├── ticket_model.pkl             # Trained SVM classifier
│   └── tfidf_vectorizer.pkl         # TF-IDF vectorizer
│
├── src/
│   ├── api/
│   │   └── app.py                   # FastAPI application (main backend)
│   ├── models/
│   │   └── model.py                 # TicketClassifier wrapper class
│   └── preprocessing/
│       └── text_cleaning.py         # Text preprocessing utilities
│
├── supportdeskfrontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication context provider
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Signup.jsx           # Registration page
│   │   │   ├── Dashboard.jsx        # Main prediction interface
│   │   │   ├── History.jsx          # Prediction history viewer
│   │   │   └── Analytics.jsx        # Charts and analytics
│   │   ├── App.js                   # Main app component with routing
│   │   ├── supabase.js              # Supabase client config
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Global styles
│   ├── package.json                 # Frontend dependencies
│   ├── tailwind.config.js           # Tailwind configuration
│   └── postcss.config.js            # PostCSS configuration
│
├── .env                              # Backend environment variables
├── requirements.txt                  # Python dependencies
└── README.md
```

---

## Dataset Details

**File:** `data/raw/tickets.csv`
**Size:** 28,591 rows
**Columns:**
- `subject`: Ticket subject line
- `body`: Full ticket description
- `type`: Ticket category (Incident, Request, Problem, Change)
- `queue`: Support queue assignment
- `priority`: low, medium, high
- `language`: en, de (English, German)
- Additional metadata: version, tags, answer text

**Preprocessing:**
- Text cleaning removes URLs, emails, phone numbers, special characters
- Case normalization to lowercase
- Multiple spaces collapsed to single space
- NaN values handled gracefully

---

## Backend API (`src/api/app.py`)

### Core Features
1. **ML Model Loading:**
   - Loads pre-trained SVM classifier and TF-IDF vectorizer from `models/` directory
   - Graceful failure handling if models not found
   - Logs model load status

2. **Text Preprocessing:**
   - Imports custom `clean_text()` function from `src/preprocessing/text_cleaning.py`
   - Fallback no-op cleaner if import fails

3. **Supabase Integration:**
   - Connects using environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
   - Saves prediction history to `history` table with user_id, subject, body, predicted_category
   - Graceful degradation if Supabase unavailable

4. **CORS Configuration:**
   - Currently set to `allow_origins=["*"]` for development (should be restricted in production)
   - Allows all methods and headers

### API Endpoints

#### POST `/predict`
**Purpose:** Classify a support ticket and optionally save to history

**Request Body:**
```json
{
  "subject": "string",
  "body": "string",
  "user_id": "string (optional)"
}
```

**Response:**
```json
{
  "category": "Incident | Request | Problem | Change",
  "confidence": 0.85,
  "top_classes": [
    {"label": "Incident", "score": 0.85},
    {"label": "Request", "score": 0.10},
    {"label": "Problem", "score": 0.05}
  ]
}
```

**Logic:**
1. Concatenates subject + body
2. Cleans text using `clean_text()`
3. Transforms text using TF-IDF vectorizer
4. Predicts category using SVM model
5. Calculates confidence scores using decision_function + softmax
6. Returns top 3 predictions with scores
7. If `user_id` provided, saves to Supabase `history` table

**Error Handling:**
- Returns HTTP 500 with "Internal server error" if prediction fails
- Logs exceptions with traceback
- Continues even if Supabase insert fails (logs exception)

---

## Machine Learning Pipeline

### Model Training (from notebooks)

**01_eda.ipynb:**
- Loads raw ticket data
- Performs exploratory analysis
- Visualizes distribution of ticket types, priorities, languages
- Identifies missing values and duplicates

**02_model.ipynb:**
- Loads cleaned data
- Splits data into train/test sets
- Applies TF-IDF vectorization to combined subject+body text
- Trains SVM classifier with linear kernel
- Evaluates model performance (classification report, confusion matrix)
- Saves trained model and vectorizer to `models/` directory using joblib

**Model Details:**
- **Algorithm:** Support Vector Machine (SVM) with linear kernel
- **Vectorization:** TF-IDF (Term Frequency-Inverse Document Frequency)
- **Input:** Concatenated subject + body text (cleaned)
- **Output:** One of 4 classes: Incident, Request, Problem, Change
- **Confidence:** Computed via decision_function scores + softmax normalization

---

## Frontend Application

### Routing Structure
- `/login` - User login (unauthenticated)
- `/signup` - User registration (unauthenticated)
- `/` - Dashboard (authenticated) - main prediction interface
- `/history` - History page (authenticated) - view past predictions
- `/analytics` - Analytics page (authenticated) - charts and visualizations

### Authentication Flow (`AuthContext.jsx`)
- Uses Supabase Auth SDK
- Listens for auth state changes
- Provides `user` and `loading` state via React Context
- Auto-redirects to login if not authenticated
- Logout via `supabase.auth.signOut()`

### Pages

#### **Dashboard (`Dashboard.jsx`)**
**Features:**
- Prediction form with subject and body inputs
- Submit button calls `/predict` API endpoint
- Displays prediction result with category, confidence %, and top 3 classes
- Summary tiles showing:
  - Total predictions count
  - Most common category
  - Last prediction category
  - Unique categories count
- Dark/light mode toggle

**API Integration:**
```javascript
axios.post("http://127.0.0.1:8000/predict", {
  subject,
  body,
  user_id: user?.id
})
```

#### **History (`History.jsx`)**
**Features:**
- Fetches all predictions for logged-in user from Supabase `history` table
- Displays table with: timestamp, subject, predicted category
- Search/filter by subject or category
- Export to CSV functionality
- Dark/light mode support

**Supabase Query:**
```javascript
supabase
  .from("history")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
```

#### **Analytics (`Analytics.jsx`)**
**Features:**
- Fetches prediction history from Supabase
- Displays 3 interactive charts:
  1. **Bar Chart:** Tickets per category
  2. **Pie Chart:** Category distribution
  3. **Line Chart:** Predictions over time (cumulative)
- Uses Chart.js library
- Dark/light mode support

#### **Login/Signup**
- Email + password authentication via Supabase
- Form validation
- Error handling with user-friendly messages
- Redirects to dashboard on success

---

## Environment Configuration

### Backend (`.env` in project root)
```env
SUPABASE_URL=<REDACTED>
SUPABASE_SERVICE_KEY=<REDACTED>
```

### Frontend (`supportdeskfrontend/.env`)
```env
REACT_APP_SUPABASE_URL=<REDACTED>
REACT_APP_SUPABASE_ANON_KEY=<REDACTED>
```

**Note:** The backend uses `SUPABASE_SERVICE_KEY` (admin key) for server-side operations, while frontend uses `SUPABASE_ANON_KEY` (public key) with Row Level Security (RLS).

---

## Database Schema (Supabase)

### `history` table
```sql
CREATE TABLE history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  predicted_category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Stores all predictions for authenticated users
**Indexes:** user_id, created_at for efficient queries

---

## Dependencies

### Backend (`requirements.txt`)
```
pandas
numpy
scikit-learn
matplotlib
seaborn
notebook
fastapi
uvicorn
python-dotenv
joblib
supabase-py
```

### Frontend (`package.json`)
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.86.0",
    "axios": "^1.13.2",
    "chart.js": "^4.5.1",
    "react": "^19.2.0",
    "react-chartjs-2": "^5.3.1",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.10.0",
    "react-scripts": "5.0.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.17",
    "autoprefixer": "^10.4.22",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.18"
  }
}
```

---

## Running the Application

### Backend Setup
```bash
# Navigate to project root
cd supportDeskAI

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# source venv/bin/activate    # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Ensure .env file exists with Supabase credentials

# Start FastAPI server
uvicorn src.api.app:app --host 127.0.0.1 --port 8000
# Or with auto-reload for development:
# uvicorn src.api.app:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd supportdeskfrontend

# Install dependencies
npm install

# Ensure .env file exists with Supabase credentials

# Start React dev server
npm start
# Opens browser at http://localhost:3000
```

---

## Key Implementation Details

### Text Cleaning (`text_cleaning.py`)
```python
def clean_text(text: str) -> str:
    # Handles NaN values
    # Converts to lowercase
    # Removes URLs, emails, phone numbers
    # Removes special characters
    # Collapses multiple spaces
    return cleaned_text
```

### Prediction Confidence Calculation
```python
# Get raw SVM decision scores
raw_scores = model.decision_function(X)[0]

# Apply softmax normalization
exp_scores = np.exp(raw_scores - np.max(raw_scores))
probs = exp_scores / exp_scores.sum()

# Map probabilities to class labels
classes = model.classes_
label_probs = list(zip(classes, probs))
label_probs.sort(key=lambda x: x[1], reverse=True)
```

### Resilient Model Loading
The backend gracefully handles:
- Missing model files (logs warning, continues without ML capability)
- Import errors for preprocessing module (uses fallback no-op cleaner)
- Supabase connection failures (logs error, prediction still works)
- Missing user_id (skips history save, returns prediction)

### CORS Configuration (Development)
**Current:** `allow_origins=["*"]` - allows all origins
**Production:** Should restrict to specific domains:
```python
allow_origins=[
    "https://yourdomain.com",
    "http://localhost:3000"  # Only if needed for local dev
]
```

---

## Known Issues & TODOs

1. **CORS:** Currently allows all origins (`["*"]`) - should be restricted in production
2. **History Not Showing:** Backend logs indicate potential issues:
   - User might not be authenticated when making predictions
   - `user_id` might not be passed correctly from frontend
   - Backend logs show "No user_id provided" or "Supabase client not available"
   - Check backend console for: "Attempting to insert history to Supabase for user_id=..."

3. **Error Handling:** Some error states could provide more user-friendly messages
4. **Model Retraining:** No automated pipeline for retraining with new data
5. **Testing:** No unit tests or integration tests present
6. **Documentation:** No API documentation (Swagger/OpenAPI)
7. **Deployment:** No deployment configuration (Docker, CI/CD)

---

## Debugging Tips

### Backend Not Responding
1. Check if uvicorn is running: `netstat -ano | findstr 8000`
2. View backend logs in terminal where uvicorn started
3. Check `.env` file exists in project root with correct variables
4. Verify models exist: `models/ticket_model.pkl` and `models/tfidf_vectorizer.pkl`

### Frontend CORS Errors
1. Ensure backend is running on `http://127.0.0.1:8000`
2. Check browser console for exact error
3. Verify backend CORS middleware is configured
4. Clear browser cache and reload

### History Not Saving
1. Check backend logs for: "Attempting to insert history to Supabase"
2. Verify `user_id` is passed in POST request
3. Check Supabase dashboard for `history` table records
4. Verify frontend `.env` has correct `REACT_APP_SUPABASE_ANON_KEY`
5. Check browser Network tab for failed requests to Supabase

### Model Not Loading
1. Backend logs will show: "Model or tfidf files not found in {path}"
2. Verify models exist in `models/` directory
3. Check file permissions
4. Re-run `02_model.ipynb` to regenerate models if missing

---

## Security Notes

### Current Security Posture
- **Authentication:** Handled by Supabase Auth (email/password)
- **API Security:** No authentication on `/predict` endpoint (anyone can call it)
- **Data Privacy:** Predictions saved with user_id for tracking
- **CORS:** Wide open (`*`) - restricts in production
- **Secrets:** Stored in `.env` files (not in git - should be in `.gitignore`)

### Recommendations for Production
1. Add API key or JWT authentication to `/predict` endpoint
2. Restrict CORS to specific frontend domain
3. Use HTTPS for all communications
4. Implement rate limiting to prevent abuse
5. Add input validation and sanitization
6. Use Row Level Security (RLS) policies in Supabase
7. Rotate Supabase keys regularly
8. Add logging and monitoring
9. Implement proper error handling without leaking sensitive info

---

## Model Performance Characteristics

**Expected Behavior:**
- Ticket types: Incident (most common), Request, Problem, Change
- Multi-language support: English, German
- Domains: IT support, billing, technical issues, service requests
- Confidence scores typically range 0.3-0.9 (higher = more certain)
- Top 3 predictions help identify close alternatives

**Limitations:**
- Trained on specific support ticket dataset (may not generalize to other domains)
- No real-time model updates (requires manual retraining)
- Limited to 4 categories (predefined in training data)
- No handling of spam or malicious input
- No multi-label classification (one category per ticket)

---

## Future Enhancements

1. **Model Improvements:**
   - Experiment with deep learning models (BERT, RoBERTa)
   - Add multi-label classification
   - Implement online learning for continuous improvement
   - Add confidence threshold for "uncertain" predictions

2. **Backend Features:**
   - Add user authentication to `/predict` endpoint
   - Implement API rate limiting
   - Add batch prediction endpoint
   - Create admin dashboard for model management
   - Add model versioning and A/B testing

3. **Frontend Features:**
   - Add bulk ticket upload (CSV import)
   - Implement real-time predictions (WebSocket)
   - Add ticket similarity search
   - Create admin panel for user management
   - Add more detailed analytics and filtering

4. **Infrastructure:**
   - Containerize with Docker
   - Add CI/CD pipeline
   - Implement automated testing
   - Add health check endpoints
   - Create staging environment
   - Add monitoring and alerting (Prometheus, Grafana)

5. **Data Management:**
   - Implement data versioning (DVC)
   - Add feedback loop for incorrect predictions
   - Create automated model retraining pipeline
   - Add data validation and quality checks

---

## Contact & Support

**Project Type:** AI-powered support ticket classifier
**Tech Stack:** Python FastAPI + React + Supabase + scikit-learn
**Status:** Development/MVP stage
**Last Updated:** December 2025

---

This documentation provides a complete overview of the SupportDesk AI project. All sensitive credentials have been redacted and replaced with `<REDACTED>`. Use this as a reference for understanding the project architecture, codebase structure, and implementation details.
