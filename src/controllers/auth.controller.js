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

// ── PUT /api/auth/update-profile ──────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
    const { name } = req.body;
  
    if (!name || name.trim().length < 2) {
      return errorResponse(res, 400, 'Name must be at least 2 characters');
    }
  
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
  
    return successResponse(res, 200, 'Profile updated successfully', { user });
  });
  
  // ── PUT /api/auth/change-password ─────────────────────────────────────────────
  const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
  
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, 'Please provide current and new password');
    }
  
    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'New password must be at least 6 characters');
    }
  
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
  
    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 401, 'Current password is incorrect');
    }
  
    // Set new password — pre save hook will hash it
    user.password = newPassword;
    await user.save();
  
    return successResponse(res, 200, 'Password changed successfully');
  });
  
  module.exports = { register, login, getMe, logout, updateProfile, changePassword };