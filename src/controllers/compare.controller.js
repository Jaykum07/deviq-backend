// compare.controller.js
// Takes 2 to 4 GitHub usernames
// Fetches or uses cached analysis for each
// Returns them ranked by totalScore

const Analysis      = require('../models/Analysis.model');
const SearchHistory = require('../models/SearchHistory.model');
const asyncHandler  = require('../utils/asyncHandler');
const { analyzeGithubUser }              = require('../services/github.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ── POST /api/compare ─────────────────────────────────────────────────────────
// Body: { "usernames": ["torvalds", "gaearon", "yyx990803"] }
const compareUsers = asyncHandler(async (req, res) => {
  const { usernames } = req.body;

  // ── Validate input ──────────────────────────────────────────────────────────
  if (!usernames || !Array.isArray(usernames)) {
    return errorResponse(res, 400, 'Please provide usernames array');
  }

  if (usernames.length < 2) {
    return errorResponse(res, 400, 'Provide at least 2 usernames to compare');
  }

  if (usernames.length > 4) {
    return errorResponse(res, 400, 'Cannot compare more than 4 usernames at once');
  }

  // ── Fetch analysis for each username ────────────────────────────────────────
  const results = [];
  const errors  = [];

  for (const username of usernames) {
    const cleanUsername = username.toLowerCase().trim();

    try {
      // Check cache first
      let analysis = await Analysis.findOne({
        githubUsername: cleanUsername,
        cachedUntil:    { $gt: new Date() },
      });

      if (!analysis) {
        // Not cached — fetch from GitHub
        console.log(`Fetching for compare: ${cleanUsername}`);
        const data = await analyzeGithubUser(cleanUsername);

        const existing = await Analysis.findOne({ githubUsername: cleanUsername });

        if (existing) {
          existing.profile      = data.profile;
          existing.repositories = data.repositories;
          existing.metrics      = data.metrics;
          existing.scores       = data.scores;
          existing.status       = 'completed';
          existing.cachedUntil  = new Date(Date.now() + 6 * 60 * 60 * 1000);
          analysis = await existing.save();
        } else {
          analysis = await Analysis.create({
            githubUsername: cleanUsername,
            profile:        data.profile,
            repositories:   data.repositories,
            metrics:        data.metrics,
            scores:         data.scores,
            status:         'completed',
            cachedUntil:    new Date(Date.now() + 6 * 60 * 60 * 1000),
          });
        }

        // Save to search history for each username compared
        await SearchHistory.create({
          userId:         req.user._id,
          githubUsername: cleanUsername,
          analysisId:     analysis._id,
          label:          'comparison search',
        });
      }

      // Push clean result object
      results.push({
        githubUsername:  analysis.githubUsername,
        name:            analysis.profile.name,
        avatarUrl:       analysis.profile.avatarUrl,
        publicRepos:     analysis.profile.publicRepos,
        followers:       analysis.profile.followers,
        primaryLanguage: analysis.metrics.primaryLanguage,
        totalStars:      analysis.metrics.totalStars,
        scores:          analysis.scores,
      });

    } catch (err) {
      // If one username fails, don't crash — record the error
      errors.push({
        username: cleanUsername,
        message:  err.message === 'Not Found'
          ? `GitHub user "${cleanUsername}" not found`
          : err.message,
      });
    }
  }

  // Must have at least 2 successful results to compare
  if (results.length < 2) {
    return errorResponse(res, 400, 'Could not fetch enough profiles to compare', errors);
  }

  // ── Rank by totalScore — highest first ──────────────────────────────────────
  const ranked = results.sort((a, b) => b.scores.totalScore - a.scores.totalScore);

  // Add rank number to each result
  ranked.forEach((r, index) => {
    r.rank = index + 1;   // rank 1 = best
  });

  return successResponse(res, 200, 'Comparison complete', {
    count:   ranked.length,
    winner:  ranked[0].githubUsername,
    results: ranked,
    errors:  errors.length > 0 ? errors : undefined,
  });
});

module.exports = { compareUsers };