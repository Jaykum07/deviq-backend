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
- Search history with pagination and TTL auto-expiry (90 days)
- Developer comparison engine (2 to 4 developers at once)
- Save single and comparison reports with frozen snapshots
- Delete individual or all history entries
- Downloadable PDF reports (coming soon)

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
    │   ├── history.controller.js   ← get, delete search history
    │   ├── compare.controller.js   ← compare multiple developers
    │   └── report.controller.js    ← save, get, delete reports
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
    │   ├── history.routes.js       ← /api/history/*
    │   ├── compare.routes.js       ← /api/compare/*
    │   └── report.routes.js        ← /api/reports/*
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

| Method | Endpoint      | Access    | Description              |
|--------|---------------|-----------|--------------------------|
| POST   | `/register`   | Public    | Create new account       |
| POST   | `/login`      | Public    | Login, receive JWT       |
| GET    | `/me`         | Protected | Get current user profile |
| POST   | `/logout`     | Protected | Logout, clear token      |

### GitHub Routes — `/api/github`

| Method | Endpoint             | Access    | Description                    |
|--------|----------------------|-----------|--------------------------------|
| POST   | `/analyze/:username` | Protected | Analyze GitHub profile + score |

### History Routes — `/api/history`

| Method | Endpoint | Access    | Description                       |
|--------|----------|-----------|-----------------------------------|
| GET    | `/`      | Protected | Get my search history (paginated) |
| DELETE | `/:id`   | Protected | Delete one history entry          |
| DELETE | `/`      | Protected | Clear all my history              |

### Compare Routes — `/api/compare`

| Method | Endpoint | Access    | Description                              |
|--------|----------|-----------|------------------------------------------|
| POST   | `/`      | Protected | Compare 2 to 4 GitHub profiles, ranked  |

### Report Routes — `/api/reports`

| Method | Endpoint | Access    | Description                        |
|--------|-----------|-----------|------------------------------------|
| POST   | `/`       | Protected | Save single or comparison report   |
| GET    | `/`       | Protected | Get all my saved reports           |
| GET    | `/:id`    | Protected | Get one report with full snapshot  |
| DELETE | `/:id`    | Protected | Delete a report                    |

---

## Database Design

### Collections

| Collection        | Purpose                               | Privacy                            |
|-------------------|---------------------------------------|------------------------------------|
| `users`           | Platform accounts (recruiters)        | Each user is separate              |
| `analyses`        | GitHub profile data + scores          | Shared cache — fetched once        |
| `searchhistories` | Who searched which GitHub username    | Private per user                   |
| `reports`         | Saved single and comparison reports   | Private per user                   |

### Key Design Decisions

**Single database, isolated by userId.**
One MongoDB database serves all users. Isolation is achieved through
the `userId` field on every private document. When User A queries
history, the server filters `{ userId: req.user._id }` — User B's
data is never touched.

**Caching strategy.**
GitHub API data is cached in MongoDB for 6 hours. If two recruiters
search the same developer, GitHub API is called only once. The second
request reads from the local cache. This also protects against
GitHub's 5000 requests per hour rate limit.

**History auto-expiry.**
Search history uses MongoDB TTL index — documents older than 90 days
are automatically deleted by MongoDB's background process. No cron
job needed. Same pattern used by Google, GitHub, and Amazon.

**Snapshot in reports.**
When a report is saved, scores are frozen at that moment inside a
`snapshot` field. Even if the developer pushes more code later, the
saved report reflects the scores at the time of evaluation. This is
how a marksheet works — frozen at exam date.

**Comparison ranking.**
When comparing developers, results are sorted by `totalScore`
descending. The top result is flagged as `winner` in the response.

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
  "data": { }
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
docs: update README mark all backend routes complete
feat: add reports routes - save single and comparison reports with snapshot
feat: add compare route with ranking and cache reuse
feat: add search history routes with pagination and delete
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

### Backend
- [x] Project setup and folder structure
- [x] MongoDB connection with env validation
- [x] User authentication — register, login, logout
- [x] JWT middleware — access token + refresh token
- [x] GitHub profile analysis with 6 hour caching
- [x] Custom scoring engine — 5 dimensions, 0 to 100
- [x] Search history — paginated, TTL auto-expiry 90 days
- [x] Compare developers — 2 to 4 profiles, auto ranked
- [x] Save reports — single and comparison with snapshot
- [x] Get and delete saved reports
- [ ] PDF report download

### Frontend
- [ ] React + Vite setup
- [ ] Login and register pages
- [ ] Dashboard with search
- [ ] Analysis result page with score breakdown
- [ ] Compare page with side by side view
- [ ] Reports page with saved reports list

---

## Author

Built as a Pre final year project demonstrating full-stack MERN development
with real-world API integration, database design, and authentication.