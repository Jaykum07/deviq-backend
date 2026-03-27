//Analysis.model.js
//This stores everything fetched from Github API for one username
//This document is Shared - if 2 users search 'john123'
//Github is called only once. Both users read this same document.

const mongoose = require('mongoose');
const { compile } = require('morgan');

//----Sub-schema: one repository's data--------------
//we don't give it separate collection - it lives INSIDE Analysis document
//This is called "embedding" in MONOGODB

const RepoSchema = new mongoose.Schema({
    name: {type: String},
    fullName: {type: String}, //"username/repo-name"
    description: {type: String, default: ''},
    url: {type: String},
    language: {type: String, default:'Unknown'},
    stars: {type: Number, default: 0},
    forks: {type: Number, default: 0},
    watchers:  {type: Number, default: 0},
    openIssues:  {type: Number, default: 0},
    size:  {type: Number, default: 0}, //in KB
    isForked: {type: Boolean, default:false},
    hasReadme: {type: Boolean, default: false},
    topics: {type: [String], default: []},
    pushedAt: {type: Date}, //last commit date
    createdAt: {type: Date}
}, {_id: false } //no separate _id for each repo object
);

//----Sub-Schema: score breakdown------------
const ScoreSchema = new mongoose.Schema({
    activityScore: {type: Number, default: 0}, //max 20
    popularityScore: {type: Number, default: 0}, //max 25
    qualityScore: {type: Number, default: 0}, //max 20
    diversityScore: {type: Number, default: 0}, //max 15
    communityScore: {type: Number, default: 0}, //max 20
    totalScore: {type: Number, default: 0}, //max 100
}, {_id: false}
);

//---Main Analysis Schema---------
const AnalysisSchema = new mongoose.Schema(
{
    //which Github user this analysis belongs to
    githubUsername:{
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    //Raw profile data from Github API
    profile:{
        githubId:{type: Number},
        name: {type: String},
        bio: {type:String, default: ''},
        company: {type: String, default: ''},
        location: {type: String, default:''},
        blog:{type:String, default: ''},
        avatarUrl: {type: String},
        publicRepos: {type: Number, default: 0},
        followers: {type: Number, default: 0},
        following: {type:Number, default: 0},
        accountCreatedAt: {type: Date}
    },
    //Top 30 repos Stored as embedded array
    repositories: [RepoSchema],

    //Calculated summary numbers
    metrics:{
        totalStars: {type: Number, default: 0},
        totalForks: {type:Number, default: 0},
        primaryLanguage: {type:String, default:'Unkown'},
        langaugeDistribution: {type: Map, of:Number},
        //Map Stores: {"JavaScript": 12, "Python": 8, "CSS": 5}
        totalRepos: {type:Number, default:0},
        activeReposCount: {type:Number, default:0},
        repoWithReadmeCount: {type:Number, default:0},
        accountAgeInDays: { type: Number, default: 0 },
        mostStarredRepo: { type: String, default: '' },
    },

    //Calculated score breakdown
    scores: ScoreSchema,
    //Cache control - re-fetch after this time
    //Default: 6 hours from now
    cacheUntil:{
        type: Date,
        default: ()=>new Date(Date.now()+6*60*60*1000),
    },

    //if github api fails for this username
    status:{
        type:String,
        enum: ['completed', 'failed'],
        default: completed,
    },

},{timestamps: true}
);

//Index for fast lookup by username
AnalysisSchema.index({ githubUsername: 1});

const AnalysisModel = mongoose.model('Analysis', AnalysisSchema)

