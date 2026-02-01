# AI Learning App (Duolingo Style)

A monorepo containing the mobile app and backend service for the AI Learning platform.

## Structure
- `/mobile`: React Native Expo app (TypeScript)
- `/backend`: Python FastAPI service
- `/supabase`: Database schema and configuration
- `/doc`: Documentation

## Getting Started

### Backend
1. Navigate to `/backend` (or root).
2. Create/Activate virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn backend.main:app --reload
   ```
   Health check: `http://127.0.0.1:8000/health`

### Mobile
1. Navigate to `/mobile`:
   ```bash
   cd mobile
   ```
2. Install dependencies (if not done):
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npx expo start
   ```
   Press `i` for iOS simulator or `a` for Android emulator.

## Environment Variables
Copy `.env.example` to `.env` (if applicable) and fill in Supabase credentials.
