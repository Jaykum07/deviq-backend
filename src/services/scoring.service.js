// Pure calculation — no DB, no API calls
// Takes raw data, returns score object
// Easy to test, easy to explain in interview

const calculateScores = (profile, repos, metrics) => {

    // ── SCORE 1: Activity (max 20 points) ──────────────────────────────────────
    // Question: How recently and regularly has this developer pushed code?
    // Logic: Count repos with activity in last 6 months
    const SIX_MONTHS_AGO = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  
    const activeRepos = repos.filter(
      (repo) => repo.pushedAt && new Date(repo.pushedAt) > SIX_MONTHS_AGO
    ).length;
  
    const totalRepos = repos.length || 1; // avoid divide by zero
    const activityScore = Math.min(20, Math.round((activeRepos / totalRepos) * 20));
  
    // ── SCORE 2: Popularity (max 25 points) ────────────────────────────────────
    // Question: Do other developers find this person's work useful?
    // Logic: Stars and forks = real-world appreciation
    // We use log10 because star counts vary hugely (1 to 10000+)
    // log10(1000) = 3, log10(10) = 1 — prevents one viral repo dominating score
    const totalStars = metrics.totalStars || 0;
    const totalForks = metrics.totalForks || 0;
  
    const popularityRaw =
      Math.log10(totalStars + 1) * 9 +   // +1 avoids log10(0) = -Infinity
      Math.log10(totalForks + 1) * 6;
  
    const popularityScore = Math.min(25, Math.round(popularityRaw));
  
    // ── SCORE 3: Quality (max 20 points) ───────────────────────────────────────
    // Question: Does this developer follow good practices?
    // Checks: README present, topics tagged, not all repos are forks
    const withReadme  = metrics.repoWithReadmeCount || 0;
    const ownRepos    = repos.filter((r) => !r.isForked).length;
    const withTopics  = repos.filter((r) => r.topics && r.topics.length > 0).length;
  
    const qualityScore = Math.min(
      20,
      Math.round(
        (withReadme / totalRepos) * 8 +   // README presence = 8 points max
        (ownRepos   / totalRepos) * 7 +   // original work = 7 points max
        (withTopics / totalRepos) * 5     // topics tagged = 5 points max
      )
    );
  
    // ── SCORE 4: Diversity (max 15 points) ─────────────────────────────────────
    // Question: Does this developer know multiple technologies?
    // Logic: Count distinct languages used across all repos
    const languageCount = Object.keys(metrics.languageDistribution || {}).length;
    // 1 language = 2.5 pts, 6 languages = 15 pts (max)
    const diversityScore = Math.min(15, Math.round(languageCount * 2.5));
  
    // ── SCORE 5: Community (max 20 points) ─────────────────────────────────────
    // Question: Is this developer recognized in the community?
    // Logic: Followers count shows reputation
    const followers = profile.followers || 0;
  
    const communityRaw = Math.log10(followers + 1) * 10;
    const communityScore = Math.min(20, Math.round(communityRaw));
  
    // ── TOTAL (max 100 points) ──────────────────────────────────────────────────
    const totalScore =
      activityScore +
      popularityScore +
      qualityScore +
      diversityScore +
      communityScore;
  
    return {
      activityScore,    // 0–20
      popularityScore,  // 0–25
      qualityScore,     // 0–20
      diversityScore,   // 0–15
      communityScore,   // 0–20
      totalScore,       // 0–100
    };
  };
  
  module.exports = { calculateScores };
  
  // INTERVIEW ANSWER — "How did you calculate the score?"
  // "We break it into 5 dimensions: activity, popularity, quality,
  //  diversity, and community. Each has a maximum weight.
  //  We use log scale for stars/followers because distributions are skewed —
  //  a developer with 1000 stars shouldn't score 100x more than one with 10."