// Stores EVERY search user a makes
// This is PRIVATE - each document belongs to one user
//Two users searching same person = two separate documents here

const mongoose = require('mongoose');

const SearchHistorySchema = new mongoose.Schema({
    //which platform user made this search
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', //reference to user collection
        required: true,
    },

    //which Github username they searched
    githubUsername:{
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },

    //pointer to the analysis document for this username
    //so we don't store github data twice
    analysisId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Analysis',
    },

    //User can add a personal label to this search
    //Example: "Frontend batch", "React developer", "Shortlisted"
    label:{
        type: String,
        default: '',
        maxlength: 100
    },
    searchedAt:{
        type:Date,
        default:Date.now(),
    },

}, {timestamps: false} // we use searchedAt manaually, timstamps not needed
); 

//--INDEX 1: Fast query - "give me all searches by this user, newest first"--------
//Without index: MongoDB scans all doucments in collection
//With index: MongoDB jumps directly to this user's documents
SearchHistorySchema.index({userId:1, searchedAt: -1});

//--Index 2: TTL (Time to Live)- Mongodb auto-deletes after 90 days--------
//No cron job needed. MongoDB's background process runs every ~60seconds
//and deletes documents where searchedAt is older than 90days
//this is how google, github, amazon manage their history too

SearchHistorySchema.index({
    searchedAt: 1
}, {expireAfterSeconds: 60*60*24*90} //90days in seconds
);

const SearchHistoryModel = mongoose.model("SearchHistory", SearchHistorySchema);

module.exports = SearchHistoryModel;