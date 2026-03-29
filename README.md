# DevIQ — Developer Intelligence Platform (Backend)

REST API backend for the DevIQ platform. Built with Node.js, Express,
and MongoDB. Provides GitHub profile analysis, custom scoring engine,
search history, developer comparison, and report management.

> Frontend repository: https://github.com/YOUR_USERNAME/deviq-frontend

---

## Problem Statement

Manual evaluation of GitHub profiles is time-consuming and lacks
standardized metrics. This backend automates that evaluation process
by fetching GitHub data, calculating performance scores across 5
dimensions, and providing APIs for recruiters to search, compare,
and save developer reports.

---

## Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Runtime        | Node.js                           |
| Framework      | Express.js                        |
| Database       | MongoDB Atlas (Mongoose ODM)      |
| Authentication | JWT — Access Token + Refresh Token|
| Password       | bcrypt (salt rounds 12)           |
| GitHub Data    | GitHub REST API v3                |
| Caching        | MongoDB TTL (6 hour cache)        |
| History Expiry | MongoDB TTL Index (90 days)       |

---

## Project Structure
```
Backend/
├── server.js                     ← entry point, starts server
├── .env                          ← secret config (never committed)
├── .env.example                  ← env template for new developers
└── src/
    ├── app.js                    ← Express setup, middleware, routes
    │
    ├── config/
    │   ├── db.js                 ← MongoDB connection
    │   └── env.js                ← validates required env vars on startup
    │
    ├── controllers/
    │   ├── auth.controller.js    ← register, login, logout, getMe
    │   ├── github.controller.js  ← analyze username with caching
    │   ├── history.controller.js ← get, delete search history
    │   ├── compare.controller.js ← compare 2 to 4 developers
    │   └── report.controller.js  ← save, get, delete reports
    │
    ├── middleware/
    │   ├── auth.middleware.js    ← verify JWT on protected routes
    │   ├── errorHandler.js       ← global error handler
    │   └── rateLimiter.js        ← prevent API abuse
    │
    ├── models/
    │   ├── User.model.js         ← platform users (recruiters)
    │   ├── Analysis.model.js     ← GitHub data + scores, shared cache
    │   ├── SearchHistory.model.js← private search history per user
    │   └── Report.model.js       ← saved single and comparison reports
    │
    ├── routes/
    │   ├── auth.routes.js        ← /api/auth/*
    │   ├── github.routes.js      ← /api/github/*
    │   ├── history.routes.js     ← /api/history/*
    │   ├── compare.routes.js     ← /api/compare/*
    │   └── report.routes.js      ← /api/reports/*
    │
    ├── services/
    │   ├── github.service.js     ← all GitHub API communication
    │   └── scoring.service.js    ← score calculation logic
    │
    └── utils/
        ├── asyncHandler.js       ← eliminates try/catch in controllers
        ├── apiResponse.js        ← standard success/error response shape
        └── generateToken.js      ← JWT access and refresh token creation
```

---

## API Reference

### Standard Response Format

Every endpoint returns this shape:
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

### Auth — `/api/auth`

| Method | Endpoint    | Access    | Description                    |
|--------|-------------|-----------|--------------------------------|
| POST   | `/register` | Public    | Create new recruiter account   |
| POST   | `/login`    | Public    | Login and receive JWT tokens   |
| GET    | `/me`       | Protected | Get current user profile       |
| POST   | `/logout`   | Protected | Logout and clear refresh token |

**Register body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "yourpassword"
}
```

**Login body:**
```json
{
  "email": "rahul@example.com",
  "password": "yourpassword"
}
```

**Login response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "_id": "...", "name": "Rahul", "email": "..." },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

---

### GitHub — `/api/github`

| Method | Endpoint             | Access    | Description                        |
|--------|----------------------|-----------|------------------------------------|
| POST   | `/analyze/:username` | Protected | Fetch, score and cache GitHub user |

**How caching works:**
- First request for a username → calls GitHub API → saves to MongoDB
- Subsequent requests within 6 hours → returns from MongoDB cache
- After 6 hours → fetches fresh data from GitHub API again
- This protects against GitHub's 5000 req/hour rate limit

**Response includes:**
- Full GitHub profile
- Top 30 repositories with details
- Calculated metrics (stars, forks, languages)
- Score breakdown across 5 dimensions

---

### History — `/api/history`

| Method | Endpoint | Access    | Description                            |
|--------|----------|-----------|----------------------------------------|
| GET    | `/`      | Protected | Get my search history, paginated       |
| DELETE | `/:id`   | Protected | Delete one specific history entry      |
| DELETE | `/`      | Protected | Clear all my history                   |

**Pagination query params:**
```
GET /api/history?page=1&limit=10
```

**Pagination response:**
```json
{
  "data": {
    "history": [ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 4,
      "totalRecords": 38,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### Compare — `/api/compare`

| Method | Endpoint | Access    | Description                          |
|--------|----------|-----------|--------------------------------------|
| POST   | `/`      | Protected | Compare 2 to 4 GitHub profiles       |

**Body:**
```json
{
  "usernames": ["torvalds", "gaearon", "yyx990803"]
}
```

**Response:**
```json
{
  "data": {
    "count": 3,
    "winner": "torvalds",
    "results": [
      { "rank": 1, "githubUsername": "torvalds",  "scores": { "totalScore": 85 } },
      { "rank": 2, "githubUsername": "gaearon",   "scores": { "totalScore": 72 } },
      { "rank": 3, "githubUsername": "yyx990803", "scores": { "totalScore": 68 } }
    ]
  }
}
```

---

### Reports — `/api/reports`

| Method | Endpoint | Access    | Description                              |
|--------|----------|-----------|------------------------------------------|
| POST   | `/`      | Protected | Save single or comparison report         |
| GET    | `/`      | Protected | Get all my saved reports                 |
| GET    | `/:id`   | Protected | Get one report with full score snapshot  |
| DELETE | `/:id`   | Protected | Delete a report                          |

**Save single report body:**
```json
{
  "title": "Torvalds Analysis March 2025",
  "type": "single",
  "analysisId": "664abc123...",
  "notes": "Strong C developer"
}
```

**Save comparison report body:**
```json
{
  "title": "Top 3 Frontend Devs",
  "type": "comparison",
  "analysisIds": ["664abc...", "664def...", "664ghi..."],
  "notes": "Comparing for senior frontend role"
}
```

---

## Scoring System

Each GitHub profile scores 0 to 100 across 5 dimensions:

| Dimension   | Max | Formula                                        |
|-------------|-----|------------------------------------------------|
| Activity    | 20  | Repos pushed in last 6 months / total repos    |
| Popularity  | 25  | log10(stars + 1) × 9 + log10(forks + 1) × 6   |
| Quality     | 20  | README ratio × 8 + original ratio × 7 + topics × 5 |
| Diversity   | 15  | Distinct languages × 2.5 (max 6 languages)     |
| Community   | 20  | log10(followers + 1) × 10                      |

Log scale is used for stars and followers because distributions are
heavily skewed. A developer with 1000 stars should not score 100x
more than one with 10 stars.

---

## Database Design

### Four Collections

| Collection        | Purpose                          | Privacy              |
|-------------------|----------------------------------|----------------------|
| `users`           | Recruiter accounts               | Isolated by _id      |
| `analyses`        | GitHub data and scores           | Shared cache         |
| `searchhistories` | Who searched which username      | Private per userId   |
| `reports`         | Saved reports with snapshots     | Private per userId   |

### Key Design Decisions

**One database, isolated by userId.**
All users share one MongoDB instance. Privacy is enforced in every
query using `{ userId: req.user._id }` filter. User A never sees
User B's history or reports.

**Shared analysis cache.**
If 50 recruiters search the same developer, GitHub API is called
once. All 50 read from the same `analyses` document. The
`cachedUntil` field controls freshness.

**TTL auto-expiry on history.**
MongoDB TTL index deletes search history older than 90 days
automatically. No cron job. Same pattern used by Google and GitHub.

**Frozen snapshots in reports.**
Scores are copied into a `snapshot` field when a report is saved.
Even if the developer pushes more code next week, the saved report
shows scores from the evaluation date. Same concept as a marksheet.

---

## Setup and Installation

### Prerequisites

- Node.js v18 or higher
- MongoDB Atlas free account
- GitHub Personal Access Token

### Steps
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/deviq-backend.git
cd deviq-backend

# Install dependencies
npm install

# Copy env template
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

JWT_SECRET=your_long_random_jwt_secret
JWT_EXPIRE=7d

JWT_REFRESH_SECRET=your_long_random_refresh_secret
JWT_REFRESH_EXPIRE=30d

GITHUB_TOKEN=ghp_your_github_personal_access_token
```

### Scripts
```bash
npm run dev    # development with nodemon (auto restart)
npm start      # production
```

---

## Bugs Fixed During Development

| Bug | Cause | Fix |
|-----|-------|-----|
| Cache always returning null | Field named `cacheUntil` in model but `cachedUntil` in controller | Renamed to `cachedUntil` everywhere |
| `findOneAndUpdate` not saving correctly | Spread operator overwriting fields inconsistently | Replaced with explicit `find` then `save` or `create` |
| Mongoose deprecation warning | `new: true` option deprecated in newer Mongoose | Replaced with `returnDocument: 'after'` |

---

## Git Commit History
```
docs: update backend README with full API reference
feat: add reports routes - save single and comparison with snapshot
feat: add compare route with ranking and cache reuse
feat: add search history routes with pagination and delete
fix:  resolve cachedUntil field name mismatch between model and controller
fix:  replace findOneAndUpdate with explicit create/update for caching
feat: add GitHub analyze route with caching and search history
feat: add GitHub service and scoring engine
feat: add Analysis, SearchHistory and Report models
feat: initial project setup - folder structure, server, auth routes, JWT
docs: add README and env example file
```

---

## Current Status

### Backend — Complete
- [x] Project setup and folder structure
- [x] MongoDB connection with env validation
- [x] User authentication — register, login, logout, getMe
- [x] JWT middleware — access and refresh tokens
- [x] GitHub profile analysis with 6 hour caching
- [x] Custom scoring engine — 5 dimensions, 0 to 100
- [x] Search history — paginated, TTL 90 day auto-expiry
- [x] Compare developers — 2 to 4 profiles, auto ranked
- [x] Save reports — single and comparison with snapshot
- [x] Get and delete saved reports

### Pending
- [ ] PDF report download
- [ ] Rate limiting middleware

### Frontend
- [ ] See deviq-frontend repository

---

## Related Repository

| Repo | Description |
|------|-------------|
| [deviq-frontend](https://github.com/YOUR_USERNAME/deviq-frontend) | React + Vite frontend |

---

## Author

Built as a final year project demonstrating full-stack MERN development
with real-world API integration, caching strategy, JWT authentication,
and database design patterns.