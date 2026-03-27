const UserModel = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const {generateAccessToken, generateRefreshToken} = require('../utils/generateToken');
const {successResponse, errorResponse} = require('../utils/apiResponse');

/**
 * POST /api/auth/register
 * For registration controller
 */

const register = asyncHandler(async(req, res) => {
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return errorResponse(res, 400, "Please provide name, email and password");
    }

    const exists = await UserModel.findOne({email});
    if(exists){
        return errorResponse(res, 400, 'Email already registered');
    }

    const user = await UserModel.create({name, email, password});

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    return successResponse(res, 201, "Registration successful", {
        user:{
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        },
        accessToken,
        refreshToken
    });
});

const login = asyncHandler(async(req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return errorResponse(res, 400, 'Please provide email and password');
    }

    //must explicityly select password because select: false in schema
    const user = await UserModel.findOne({email}).select('+password');

    //check user exists + password coorrect in one condition
    // do not tell attacker which one failed --security best practice
    if(!user || !(await user.matchPassword(password))){
        return errorResponse(res, 401, 'Invalid email or password');
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    return successResponse(res, 200, 'Login successful', {
        user:{
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        accessToken,
        refreshToken
    });
});

//GET /api/auth/me

const getMe = asyncHandler(async(req, res) =>{
    //req.user already attached by protect midlleware - no extra db call needed
    return successResponse(res, 200, 'Profile fetched successfully',{
        user: req.user,
    });
});

// POST /api/auth/logout
const logout = asyncHandler(async(req, res) =>{
    await UserModel.findByIdAndUpdate(req.user._id, {refreshToken: ''});
    return successResponse(res, 200, 'Logged out successfully');
});

module.exports = {register, login, getMe, logout};