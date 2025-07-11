import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};

const registerUser = asyncHandler(async (req , res) =>{
    //get user details from frontend
    //validation
    //check if user already exist : username , email
    //check for images , check for avatar
    //upload them to cloudinary , avatar
    //create userobject = create entry in db
    //remove user password and refresh token from response
    //check for user creation
    //return res
    const {fullName , email , username , password} = req.body;
    
    if([fullName , email , username , password].some((field) => !field || field?.trim() === "")){
        throw new ApiError(400 , "All fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{username} , {email}]
    })

    if(existedUser){
        throw new ApiError(409 , "User With email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath ;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }
    // console.log(req.files)

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    if(!avatar || !avatar.url){
        // console.log("upload fail")
        throw new ApiError(400 , "Avatar file is required");
    }
    
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email, 
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser , "User Register Successfully" )
    )

})

const loginUser = asyncHandler(async (req , res) =>{
    //req body -> data
    //username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    //send response


    const {email , username , password} = req.body;

    if(!username && !email){
        throw new ApiError(400 , "UserName or Email is required")
    }

    const user = await User.findOne({
        $or : [{username} , {email}]
    })

     if(!user){
        throw new ApiError(404 , "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure : true,
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , option)
    .cookie("refreshToken" , refreshToken , option)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser , accessToken , refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req , res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const option = {
        httpOnly: true,
        secure : true,
    }


    return res
    .status(200)
    .clearCookie("accessToken" , option)
    .clearCookie("refreshToken" , option)
    .json(new ApiResponse(200 , {} , "User Logged out"))
})

const refereshAccessToken = asyncHandler(async (req , res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or has been used");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const option = {
            httpOnly: true,
            secure: true
        };

        return res.status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", refreshToken, option)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Access Token Refreshed"));

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});


export {registerUser , loginUser , logoutUser , refereshAccessToken}