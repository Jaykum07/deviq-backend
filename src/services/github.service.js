/**
 * All Github API communication happens here only
 * No other file talks to Github directly
 * This separation = easy to swap Github API version later 
 */

const https = require('https');
const {calculateScores} = require('./scoring.service');

/** Helper: fetch from Github API
 * Github API requires Authorization header to get 5000 req/hour
 * Without token: only 60 req/hour (not enough)
 */
const githubFetch = (endpoint) => {
    return new Promise((resolve, reject) =>{
        const options = {
            hostname: 'api.github.com',
            path: endpoint,
            method: 'GET',
            headers:{
                'User-Agent': 'DevIQ-App', //Github requires User-Agent header
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            },
        };

        const req = https.request(options, (res) =>{
            let data = '';

            //Data comes in chunks - collect all chunks
            res.on('data', (chunk) => { data += chunk});

            //All chunks received - parse JSON
            res.on('end', ()=>{
                try{
                    const parsed = JSON.parse(data);

                    //Github returns {message: "Not Found"} for invalid usernames
                    if(parsed.message){
                        reject(new Error(parsed.message));
                    }else{
                        resolve(parsed);
                    }
                }catch(err){
                    reject(new Error('Failed to parse Github response'));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
};

// ---Main function: analyze a Github username---------
const analyzeGithubUser = async (username) =>{

    //---1. Fetch profile--------
    const profileData = await githubFetch(`/users/${username}`);

    //---2. Fetch repositories (max 100, sorted by last updated)------
    const reposData = await githubFetch(`/users/${username}/repos?per_page=100&sort=updated&type=owner`);

    //---3. Process repos - extract only what we need -------
    const repositories = reposData.slice(0, 30).map((repo) => ({
        name: repo.name,
        fullName: repo.full_name,
        description : repo.description || '',
        url: repo.html_url,
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        openIssues: repo.open_issues_count,
        size: repo.size,
        isForked: repo.fork,
        topics: repo.topics || [],
        pushedAt: repo.pushed_at,
        createdAt: repo.created_at,
    }));

    //---4. Calculate metrics------------
    const totalStars = repositories.reduce((sum, r) => sum+r.stars, 0);
    const totalForks = repositories.reduce((sum, r) => sum+r.forks, 0);

    // Count languages across all repos
    const languageDistribution = {};
    repositories.forEach((repo) =>{
        if(repo.language && repo.language !== 'Unknown'){
            languageDistribution[repo.language] = (languageDistribution[repo.language] 
                || 0
            )+1;
        }
    });

    // Primary language = most used one
    const primaryLanguage = Object.entries(languageDistribution).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    //Active repos = pushed in last 6 months
    const SIX_MONTHS_AGO = new Date(Date.now() - 180*24*60*60*1000);
    const activeReposCount = repositories.filter(
        (r) => r.pushedAt && new Date(r.pushedAt) > SIX_MONTHS_AGO
    ).length;

    //Repos with README (we chack topics as proxy- Github API readme needs extra call)
    const repoWithReadmeCount = repositories.filter(
        (r) => r.description && r.description.length > 10
    ).length;

    //Account age in days
    const accountCreatedAt = new Date(profileData.created_at);
    const accountAgeInDays = Math.floor((Date.now() - accountCreatedAt.getTime()) / (1000*60*60*24));

    //Most starred repo name
    const mostStarredRepo = repositories.sort((a,b) => b.stars - a.stars)[0]?.name || '';

    const metrics = {
        totalStars,
        totalForks,
        primaryLanguage,
        languageDistribution,
        totalRepos: profileData.public_repos,
        activeReposCount,
        repoWithReadmeCount,
        accountAgeInDays,
        mostStarredRepo
    }

    //---5. Build clean profile object--------
    const profile = {
        githubId: profileData.id,
        name: profileData.name || username,
        bio: profileData.bio || '',
        company: profileData.company || '',
        location: profileData.location || '',
        blog: profileData.blog || '',
        avatarUrl: profileData.avatar_url,
        publicRepos: profileData.public_repos,
        followers: profileData.followers,
        following: profileData.following,
        accountCreatedAt: profileData.created_at,

    };

    //---6. Calculate scores-----------
    const scores = calculateScores(profile, repositories, metrics);


    //---7. Return everything together--------
    return {
        githubUsername: username.toLowerCase(),
        profile,
        repositories,
        metrics,
        scores,
    };

};

module.exports = {analyzeGithubUser};
