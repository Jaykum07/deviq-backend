const Analysis      = require('../models/Analysis.model');
const SearchHistory = require('../models/SearchHistory.model');
const asyncHandler  = require('../utils/asyncHandler');
const { analyzeGithubUser }              = require('../services/github.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// POST /api/github/analyze/:username
const analyzeUser = asyncHandler(async (req, res) => {
  const { username } = req.params;

  // ── 1. Check DB for fresh cached data ──────────────────────────────────────
  let analysis = await Analysis.findOne({
    githubUsername: username.toLowerCase(),
    cacheUntil: { $gt: new Date() },
  });
  console.log(new Date());
  console.log(analysis);

  if (analysis) {
    console.log(`Cache hit for: ${username}`);

  } else {
    // ── 2. No fresh cache — call GitHub API ──────────────────────────────────
    console.log(`Fetching from GitHub API: ${username}`);

    try {
      const data = await analyzeGithubUser(username);

      // ── 3. Check if document exists (just expired cache) ─────────────────
      const existing = await Analysis.findOne({
        githubUsername: username.toLowerCase(),
      });

      if (existing) {
        // Update existing document
        existing.profile      = data.profile;
        existing.repositories = data.repositories;
        existing.metrics      = data.metrics;
        existing.scores       = data.scores;
        existing.status       = 'completed';
        existing.cacheUntil  = new Date(Date.now() + 6 * 60 * 60 * 1000);
        analysis = await existing.save();

      } else {
        // Create brand new document
        analysis = await Analysis.create({
          githubUsername: username.toLowerCase(),
          profile:        data.profile,
          repositories:   data.repositories,
          metrics:        data.metrics,
          scores:         data.scores,
          status:         'completed',
          cacheUntil:    new Date(Date.now() + 6 * 60 * 60 * 1000),
        });
      }

    } catch (err) {
      if (err.message === 'Not Found') {
        return errorResponse(res, 404, `GitHub user "${username}" not found`);
      }
      return errorResponse(res, 500, `GitHub API error: ${err.message}`);
    }
  }

  // ── 4. Save to search history ───────────────────────────────────────────────
  await SearchHistory.create({
    userId:         req.user._id,
    githubUsername: username.toLowerCase(),
    analysisId:     analysis._id,
  });

  // ── 5. Return response ──────────────────────────────────────────────────────
  return successResponse(res, 200, 'GitHub profile analyzed successfully', {
    analysis,
  });
});

module.exports = { analyzeUser };