# ELD Trip Planner

A full-stack web application for planning truck trips in compliance with FMCSA Hours of Service (HOS) regulations. Generates daily log sheets, visual trip timelines, and PDF reports for commercial drivers.

![ELD Trip Planner](https://img.shields.io/badge/Status-Production-green)
![Django](https://img.shields.io/badge/Backend-Django-0C4B33)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [HOS Rules Implemented](#hos-rules-implemented)
- [Screenshots](#screenshots)
- [Deployment](#deployment)

## 📁 Project Structure

```
eld-trip-planner/
├── backend/
│   ├── backend/              # Django project settings
│   │   ├── settings.py    # Config with env variables
│   │   ├── urls.py        # Main URL routing
│   │   └── .env             # Environment variables (gitignored)
│   ├── trips/                # Main app
│   │   ├── models.py       # Trip data model
│   │   ├── views.py        # API endpoints
│   │   ├── utils.py        # HOS calculations & validation
│   │   ├── geocoding.py   # Location services
│   │   ├── routing.py      # OSRM integration
│   │   ├── pdf_generator.py  # PDF creation
│   │   └── urls.py        # App URL routing
│   ├── manage.py
│   └── .env                  # Environment variables (gitignored)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LogSheet.jsx    # SVG log visualization
│   │   │   ├── LogSheets.jsx   # Multi-day log container
│   │   │   ├── TripTimeline.jsx  # Horizontal timeline UI
│   │   │   └── Toast.jsx         # Notification component
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Authentication
│   │   │   ├── Register.jsx    # User registration
│   │   │   └── TripList.jsx     # Saved trips view
│   │   ├── services/
│   │   │   └── api.js          # Axios instance with interceptors
│   │   ├── App.jsx             # Main app with routing
│   │   └── App.css             # Global styles + animations
│   ├── .env                    # Environment variables (gitignored)
│   └── vite.config.js           # Vite configuration
└── README.md
```

## 🎯 Project Overview

ELD Trip Planner helps truck drivers and fleet managers create compliant trip plans that adhere to Federal Motor Carrier Safety Administration (FMCSA) Hours of Service regulations. The application:

- Calculates optimal trip plans based on distance and current cycle hours
- Generates 24-hour electronic log sheets (ELD) for each day
- Visualizes trips with interactive timelines
- Supports 34-hour restart logic for cycle limit compliance
- Exports logs as PDF documents
- Provides real-time validation with HOS compliance warnings

## ✨ Features

### Trip Planning
- **Smart Route Calculation**: Uses OpenStreetMap routing (OSRM) with fallback to straight-line distance
- **Cycle Tracking**: Monitors 70-hour/8-day rolling window compliance
- **34-Hour Restart**: Automatically triggers restart when cycle limit exceeded
- **Fuel Stop Planning**: Identifies optimal fuel stop locations

### Log Sheet Generation
- **SVG-Based Visualization**: Professional ELD-style grid with continuous timeline path
- **24-Hour Coverage**: Ensures every minute is accounted for
- **Status Tracking**: Off Duty, Sleeper Berth, Driving, On Duty (Not Driving)
- **PDF Export**: Downloadable log sheets for inspections

### User Experience
- **Responsive Design**: Mobile-first approach works on all devices
- **Real-Time Validation**: Immediate feedback on HOS violations
- **Interactive Timeline**: Visual trip overview with activity cards
- **Toast Notifications**: User-friendly success/error messages
- **JWT Authentication**: Secure login/register with token refresh

## 🛠 Tech Stack

### Backend
- **Framework**: Django 6.0 + Django REST Framework
- **Authentication**: SimpleJWT (JWT)
- **Geocoding**: Nominatim (OpenStreetMap)
- **Routing**: OSRM (Open Source Routing Machine)
- **PDF Generation**: ReportLab
- **Environment**: python-dotenv for configuration

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios with interceptors
- **State Management**: React hooks (useState, useEffect)

### DevOps
- **Version Control**: Git with .gitignore for secrets
- **Environment Variables**: .env files (excluded from repo)
- **Build Tool**: Vite for fast development and production builds

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/eld-trip-planner.git
cd eld-trip-planner

# Backend setup
cd backend
pip install -r requirements.txt  # or install manually: django, djangorestframework, djangorestframework-simplejwt, django-cors-headers, reportlab, python-dotenv
python manage.py migrate
python manage.py runserver

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to access the application.

## 🔧 Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install django djangorestframework djangorestframework-simplejwt django-cors-headers reportlab python-dotenv
   ```

4. **Configure environment variables:**
   Create `backend/.env` file:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   MAPBOX_API_KEY=your-mapbox-key-optional
   ```

5. **Run migrations and start server:**
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create `frontend/.env` file:
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_MAPBOX_KEY=your-mapbox-key-optional
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

**Backend:**
```bash
cd backend
python manage.py collectstatic
# Deploy to your preferred hosting service
```

## 📡 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/register/` | POST | Register new user |
| `/api/login/` | POST | Login and get JWT tokens |
| `/api/token/refresh/` | POST | Refresh access token |

### Trip Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trip/` | POST | Create trip plan with log sheets |
| `/api/trips/` | GET | List all saved trips |
| `/api/logs/pdf/` | GET | Download PDF log sheets |

### Example Request

**Create Trip Plan:**
```bash
curl -X POST http://localhost:8000/api/trip/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "current_location": "New York, NY",
    "pickup_location": "Chicago, IL",
    "dropoff_location": "Los Angeles, CA",
    "current_cycle_used": 0
  }'
```

**Response:**
```json
{
  "id": 1,
  "current_location": "New York, NY",
  "pickup_location": "Chicago, IL",
  "dropoff_location": "Los Angeles, CA",
  "distance_km": 4500,
  "trip_plan": {
    "days": [
      {
        "day": 1,
        "driving_hours": 11.0,
        "on_duty_hours": 12.5,
        "break_taken": true,
        "rest_hours": 10,
        "cycle_used_after_day": 12.5
      }
    ]
  },
  "validation": {
    "valid": true,
    "errors": []
  },
  "logs": [...],
  "coordinates": {...},
  "route": {...}
}
```

## 🚛️ HOS Rules Implemented

The application enforces the following FMCSA Hours of Service rules:

### Driving Limits
- ✅ **11-Hour Driving Limit**: Maximum 11 hours of driving per day
- ✅ **14-Hour On-Duty Limit**: Maximum 14 consecutive hours on-duty per day
- ✅ **30-Minute Break**: Required after 8 consecutive hours of driving
- ✅ **10-Hour Rest**: Required break between driving days

### Cycle Limits
- ✅ **70-Hour/8-Day Rule**: Maximum 70 on-duty hours in any 8 consecutive days
- ✅ **34-Hour Restart**: Resets cycle by taking 34 consecutive hours off-duty
- ✅ **Rolling Window**: Automatically tracks hours in 8-day sliding window

### Validation Features
- ✅ **24-Hour Verification**: Each log sheet covers exactly 24 hours
- ✅ **No Overlap Detection**: Ensures time slots don't overlap
- ✅ **Continuous Timeline**: Validates seamless status transitions
- ✅ **Compliance Warnings**: Returns specific violation messages

## 📸 Screenshots

### Trip Planning Form
*Enter trip details with location autocomplete and cycle hours used*

### ELD Log Sheet
*SVG-based visualization with continuous timeline path and status rows*

### Trip Timeline
*Horizontal timeline showing daily activities with color-coded cards*

### Mobile Responsive View
*Optimized for tablets and smartphones with stacked layouts*

### Authentication Pages
*Clean login and registration with form validation*

## 🚀 Deployment

### Backend Deployment (Heroku/DigitalOcean/Railway)

1. **Set environment variables on hosting platform:**
   - `SECRET_KEY`, `DEBUG=False`, `CORS_ALLOWED_ORIGINS`

2. **Configure database:**
   - Use PostgreSQL/MySQL for production
   - Update `settings.py` with production database config

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Update API URL:**
   ```env
   VITE_API_URL=https://your-backend-url.com/api
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   # Upload dist/ folder to hosting service
   ```

### Docker Deployment (Optional)

```dockerfile
# Backend Dockerfile
FROM python:3.12
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
python -m pytest
# Or run specific test
python -m pytest backend/tests/test_utils.py -v
```

### Test Coverage

```bash
cd backend
pip install pytest-cov
python -m pytest --cov=backend --cov-report=html
```

### Manual Testing Checklist

- [ ] **Trip Creation**: Create trip with valid/invalid locations
- [ ] **Cycle Limits**: Test with 68+ hours used (triggers 34h restart)
- [ ] **Validation**: Verify HOS compliance warnings appear
- [ ] **Authentication**: Test login/register with invalid credentials
- [ ] **PDF Export**: Verify PDF downloads correctly
- [ ] **Responsive UI**: Test on mobile/tablet viewports

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **FMCSA** for HOS regulation guidelines
- **OpenStreetMap** for geocoding services
- **OSRM** for routing calculations
- **ReportLab** for PDF generation
- **Tailwind CSS** for rapid UI development

## 📞 Contact

For questions or support, please open an issue on GitHub or contact the maintainers.

---

**Made with ❤️ for truck drivers everywhere**
