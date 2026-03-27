# DevIQ — Developer Intelligence Platform

A full-stack web application that analyzes and evaluates GitHub developer
profiles using quantitative metrics. Built for recruiters, academic 
evaluators, and project collaborators to assess developer skill levels
without manual evaluation.

---

## Problem Statement

In the current digital ecosystem, GitHub serves as a major platform for
hosting open-source and personal development projects. Manual evaluation
of GitHub profiles is time-consuming and lacks standardized metrics.
DevIQ automates that evaluation process using a custom scoring engine.

---

## Tech Stack

### Backend
- **Runtime**        — Node.js
- **Framework**      — Express.js
- **Database**       — MongoDB Atlas (Mongoose ODM)
- **Authentication** — JWT (Access Token + Refresh Token)
- **Password**       — bcrypt (salt rounds: 12)
- **GitHub Data**    — GitHub REST API v3

### Frontend (coming soon)
- React.js + Vite
- Tailwind CSS

---

## Features

- Secure user registration and login with JWT
- GitHub profile analysis and scoring
- Custom performance score (0–100) across 5 dimensions
- Search history with TTL auto-expiry (90 days)
- Developer comparison engine
- Save analysis reports
- Downloadable PDF reports

---

## Scoring System

Each GitHub profile is scored out of 100 across 5 dimensions:

| Dimension     | Max Score | What It Measures                          |
|---------------|-----------|-------------------------------------------|
| Activity      | 20        | Repos pushed in last 6 months             |
| Popularity    | 25        | Total stars and forks (log scale)         |
| Quality       | 20        | README, original work, topics tagged      |
| Diversity     | 15        | Number of distinct languages used         |
| Community     | 20        | Followers count (log scale)               |
| **Total**     | **100**   |                                           |

---

## Project Structure
```
Backend/
├── server.js                 ← entry point, starts server
└── src/
    ├── app.js                ← Express setup, middleware, routes
    ├── config/
    │   ├── db.js             ← MongoDB connection
    │   └── env.js            ← environment variable validation
    ├── controllers/
    │   ├── auth.controller.js      ← register, login, logout, getMe
    │   ├── github.controller.js    ← analyze GitHub username
    │   ├── history.controller.js   ← search history (coming soon)
    │   ├── compare.controller.js   ← compare developers (coming soon)
    │   └── report.controller.js    ← save/download reports (coming soon)
    ├── middleware/
    │   ├── auth.middleware.js      ← verify JWT token
    │   ├── errorHandler.js         ← global error handler
    │   └── rateLimiter.js          ← prevent API abuse
    ├── models/
    │   ├── User.model.js           ← platform users (recruiters)
    │   ├── Analysis.model.js       ← GitHub data + scores (shared cache)
    │   ├── SearchHistory.model.js  ← private search history per user
    │   └── Report.model.js         ← saved and comparison reports
    ├── routes/
    │   ├── auth.routes.js          ← /api/auth/*
    │   ├── github.routes.js        ← /api/github/*
    │   ├── history.routes.js       ← /api/history/* (coming soon)
    │   ├── compare.routes.js       ← /api/compare/* (coming soon)
    │   └── report.routes.js        ← /api/reports/* (coming soon)
    ├── services/
    │   ├── github.service.js       ← all GitHub API calls
    │   └── scoring.service.js      ← score calculation logic
    └── utils/
        ├── asyncHandler.js         ← removes try/catch from controllers
        ├── apiResponse.js          ← standard success/error response format
        └── generateToken.js        ← JWT access + refresh token generation
```

---

## API Endpoints

### Auth Routes — `/api/auth`

| Method | Endpoint            | Access    | Description              |
|--------|---------------------|-----------|--------------------------|
| POST   | `/register`         | Public    | Create new account       |
| POST   | `/login`            | Public    | Login, receive JWT       |
| GET    | `/me`               | Protected | Get current user profile |
| POST   | `/logout`           | Protected | Logout, clear token      |

### GitHub Routes — `/api/github`

| Method | Endpoint                  | Access    | Description                        |
|--------|---------------------------|-----------|------------------------------------|
| POST   | `/analyze/:username`      | Protected | Analyze GitHub profile + score     |

### History Routes — `/api/history` *(coming soon)*

| Method | Endpoint    | Access    | Description                        |
|--------|-------------|-----------|------------------------------------|
| GET    | `/`         | Protected | Get my search history (paginated)  |
| DELETE | `/:id`      | Protected | Delete one history entry           |
| DELETE | `/`         | Protected | Clear all my history               |

### Compare Routes — `/api/compare` *(coming soon)*

| Method | Endpoint    | Access    | Description                        |
|--------|-------------|-----------|------------------------------------|
| POST   | `/`         | Protected | Compare multiple GitHub profiles   |

### Report Routes — `/api/reports` *(coming soon)*

| Method | Endpoint           | Access    | Description                  |
|--------|--------------------|-----------|------------------------------|
| GET    | `/`                | Protected | Get all my saved reports     |
| POST   | `/`                | Protected | Save a new report            |
| GET    | `/:id`             | Protected | Get one report               |
| DELETE | `/:id`             | Protected | Delete a report              |
| GET    | `/:id/download`    | Protected | Download report as PDF       |

---

## Database Design

### Collections

| Collection      | Purpose                                        | Privacy          |
|-----------------|------------------------------------------------|------------------|
| `users`         | Platform accounts (recruiters)                 | Each user is separate |
| `analyses`      | GitHub profile data + scores                   | Shared cache — fetched once for all users |
| `searchhistories` | Who searched which GitHub username           | Private per user |
| `reports`       | Saved single and comparison reports            | Private per user |

### Key Design Decision
One MongoDB database serves all users. Isolation is achieved through
`userId` field on every private document. When User A queries history,
the server filters `{ userId: req.user._id }` — User B's data is
never touched.

### Caching Strategy
GitHub API data is cached in MongoDB for 6 hours. If two recruiters
search the same developer, GitHub API is called only once. The second
request reads from the local cache.

### History Auto-Expiry
Search history uses MongoDB TTL index — documents older than 90 days
are automatically deleted by MongoDB's background process. No cron
job needed.

---

## Setup and Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- GitHub Personal Access Token

### Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/deviq-backend.git
cd deviq-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your values in .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:
```bash
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/deviq

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRE=30d

GITHUB_TOKEN=your_github_personal_access_token
```

---

## Response Format

Every API response follows this standard format:
```json
// Success
{
  "success": true,
  "message": "GitHub profile analyzed successfully",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "GitHub user not found"
}
```

---

## Git Commit History
```
docs: update README with project progress and API endpoints
fix:  resolve cachedUntil field name mismatch between model and controller
fix:  replace findOneAndUpdate with explicit create/update for reliable caching
feat: add GitHub analyze route with caching and search history
feat: add GitHub service and scoring engine
feat: add Analysis, SearchHistory and Report models
feat: initial project setup - folder structure, server, auth routes, JWT
docs: add README and env example file
```

---

## Current Status

- [x] Project setup and folder structure
- [x] MongoDB connection
- [x] User authentication (register, login, logout)
- [x] JWT middleware (access + refresh tokens)
- [x] GitHub profile analysis
- [x] Custom scoring engine (5 dimensions, 0–100)
- [x] Search history saving with TTL auto-expiry
- [x] Response caching (6 hour TTL)
- [ ] Search history routes
- [ ] Compare developers
- [ ] Save and download reports
- [ ] Frontend (React + Vite)

---

## Author

Built as a Pre final year project demonstrating full-stack MERN development
with real-world API integration, database design, and authentication.