//all logic for search history
//every query has {userId: req.user._id} - users only see their own data

const SearchHistory = require('../models/SearchHistory.model');
const asynHandler = require('../utils/asyncHandler');
const {successResponse, errorResponse} = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET - /api/history
 * GET current user's search history with pagination
 * Query params: ?page=1&limit=10
 */

const getHistory = asyncHandler(async (req, res) =>{
    //Read page and limit from query string
    //If not provided, use defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    //page = 1 skip=0 (show records 1-10)
    //page = 2 skip=10 (show records 11-20)

    //Count total records for THIS user only 
    const total = await SearchHistory.countDocuments({
        userId: req.user._id,
    });

    //Fetch paginated records
    const history = await SearchHistory
    .find({userId: req.user._id})
    .sort({searchedAt: -1}) //newest first
    .skip(skip)
    .limit(limit)
    .populate({
        path: 'analysisId',
        select: 'githubUsername profile.name profile.avatarUrl scores.totalScore metrics.primaryLanguage'
        //populate = join with analysis collection
        //select = only return these fields (not entire document)
    })

    return successResponse(res, 200, 'Search history fetched', {
        history,
        pagination:{
            currentPage: page,
            totalPages: Math.ceil(total/limit),
            totalRecords: total,
            limit,
            hasNextPage: page< Math.ceil(total/limit),
            hasPrevPage: page>1,
        },
    });

});

/**
 * ---Delete /api/history/:id
 * Delete one specific history entry
 */
const deleteOneHistory = asynHandler(async (req,res) =>{
    const {id} = req.params;

    //find the document first - must belong to this user
    const entry = await SearchHistory.findOne({
        _id: id,
        userId: req.user._id, //Important: user can only delete their own entries
    });

    if(!entry){
        return errorResponse(res, 404, 'History entry not found');
    }

    await entry.deleteOne();

    return successResponse(res, 200, 'History entry deleted');
})

/**
 * Delete /api/history
 * Clear all history for current user
 */

const clearAllHistory = asyncHandler(async (req, res) => {
    const result = await SearchHistory.deleteMany({
        userId: req.user._id, //only deletes THIS user's history
    });

    return successResponse(res, 200, `Cleared ${result.deletedCount} history entries`);
})

module.exports = {getHistory, deleteOneHistory, clearAllHistory};