# DevIQ — Developer Intelligence Platform

A full-stack web application to analyze and evaluate GitHub developer profiles using quantitative metrics.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **Authentication**: JWT (Access + Refresh tokens)
- **Password Security**: bcrypt

## Features
- Secure user registration and login
- GitHub profile analysis and scoring
- Search history with pagination
- Developer comparison engine
- Downloadable PDF reports

## Project Structure
```
Backend/
├── server.js
└── src/
    ├── app.js
    ├── config/        ← DB connection, env validation
    ├── controllers/   ← Business logic
    ├── middleware/    ← Auth, error handling
    ├── models/        ← MongoDB schemas
    ├── routes/        ← API endpoints
    └── utils/         ← Helper functions
```

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Protected |
| POST | /api/auth/logout | Protected |

## Setup
```bash
# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Run in development
npm run dev
```

## Environment Variables
Create `.env` file with these keys (see `.env.example`):
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — Secret for access tokens
- `JWT_REFRESH_SECRET` — Secret for refresh tokens
- `GITHUB_TOKEN` — GitHub personal access token