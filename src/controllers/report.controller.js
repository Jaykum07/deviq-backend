// report.controller.js
// Save reports — single or comparison
// Snapshot freezes scores at time of saving

const Report = require("../models/Report.model");
const Analysis = require("../models/Analysis.model");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// ── POST /api/reports ─────────────────────────────────────────────────────────
// Save a new report
// Body: { title, type, analysisId } OR { title, type, analysisIds: [] }
const createReport = asyncHandler(async (req, res) => {
  const { title, type, analysisId, analysisIds, notes } = req.body;

  if (!title) {
    return errorResponse(res, 400, "Report title is required");
  }

  // ── Check for duplicate title by same user ──────────────────────────────
  const existing = await Report.findOne({
    createdBy: req.user._id,
    title: title.trim(),
  });

  if (existing) {
    return errorResponse(
      res,
      400,
      "A report with this title already exists. Please use a different title."
    );
  }

  if (!type || !["single", "comparison"].includes(type)) {
    return errorResponse(res, 400, "Type must be single or comparison");
  }

  // ── Build snapshot — freeze scores at this moment ───────────────────────────
  const snapshot = {};

  if (type === "single") {
    if (!analysisId) {
      return errorResponse(
        res,
        400,
        "analysisId is required for single report"
      );
    }

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      return errorResponse(res, 404, "Analysis not found");
    }

    // Freeze the scores right now
    snapshot[analysis.githubUsername] = {
      name: analysis.profile.name,
      avatarUrl: analysis.profile.avatarUrl,
      totalScore: analysis.scores.totalScore,
      activityScore: analysis.scores.activityScore,
      popularityScore: analysis.scores.popularityScore,
      qualityScore: analysis.scores.qualityScore,
      diversityScore: analysis.scores.diversityScore,
      communityScore: analysis.scores.communityScore,
      primaryLanguage: analysis.metrics.primaryLanguage,
      totalStars: analysis.metrics.totalStars,
      followers: analysis.profile.followers,
    };

    const report = await Report.create({
      title,
      type: "single",
      createdBy: req.user._id,
      analysisId,
      snapshot,
      notes: notes || "",
    });

    return successResponse(res, 201, "Report saved successfully", { report });
  }

  // ── Comparison report ────────────────────────────────────────────────────────
  if (type === "comparison") {
    if (!analysisIds || analysisIds.length < 2) {
      return errorResponse(
        res,
        400,
        "At least 2 analysisIds required for comparison"
      );
    }

    // Fetch all analyses and build snapshot for each
    for (const id of analysisIds) {
      const analysis = await Analysis.findById(id);
      if (!analysis) {
        return errorResponse(res, 404, `Analysis not found for id: ${id}`);
      }

      snapshot[analysis.githubUsername] = {
        name: analysis.profile.name,
        avatarUrl: analysis.profile.avatarUrl,
        totalScore: analysis.scores.totalScore,
        activityScore: analysis.scores.activityScore,
        popularityScore: analysis.scores.popularityScore,
        qualityScore: analysis.scores.qualityScore,
        diversityScore: analysis.scores.diversityScore,
        communityScore: analysis.scores.communityScore,
        primaryLanguage: analysis.metrics.primaryLanguage,
        totalStars: analysis.metrics.totalStars,
        followers: analysis.profile.followers,
      };
    }

    // Find the winner — highest totalScore in snapshot
    const winner = Object.entries(snapshot).sort(
      (a, b) => b[1].totalScore - a[1].totalScore
    )[0][0];

    const report = await Report.create({
      title,
      type: "comparison",
      createdBy: req.user._id,
      analysisIds,
      snapshot,
      notes: notes || "",
    });

    return successResponse(res, 201, "Comparison report saved", {
      report,
      winner,
    });
  }
});

// ── GET /api/reports ──────────────────────────────────────────────────────────
// Get all reports for current user
const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .select("-snapshot");
  // We exclude snapshot here — it's large
  // Frontend fetches full snapshot only when user opens one report

  return successResponse(res, 200, "Reports fetched", {
    count: reports.length,
    reports,
  });
});

// ── GET /api/reports/:id ──────────────────────────────────────────────────────
// Get one full report including snapshot
const getOneReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({
    _id: req.params.id,
    createdBy: req.user._id, // user can only access their own report
  });

  if (!report) {
    return errorResponse(res, 404, "Report not found");
  }

  return successResponse(res, 200, "Report fetched", { report });
});

// ── DELETE /api/reports/:id ───────────────────────────────────────────────────
const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!report) {
    return errorResponse(res, 404, "Report not found");
  }

  await report.deleteOne();

  return successResponse(res, 200, "Report deleted");
});

module.exports = { createReport, getReports, getOneReport, deleteReport };
