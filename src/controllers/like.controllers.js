import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video

    const {videoId} = req.params
    const {userId} = req.user._id

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const existingLike = await Like.findOne({
        video : videoId,
        likedBy : userId
    })

    let message;

    if(existingLike){
        await existingLike.deleteOne()
        message = "Video unliked successfully";
    }else{
        await Like.create({video : videoId , likedBy : userId})
        message = "Video liked successfully"
    }

    return res
        .status(200)
        .json(new ApiResponse(200 , null , message))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment

    const {commentId} = req.params
    const {userId} = req.user._id
 
    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID")
    }

    const existingLike = await Like({
        comment : commentId,
        likedBy : userId
    })

    let message;

    if(existingLike){
        await existingLike.deleteOne()
        message = "comment unliked successfully";
    }else{
        await Like.create({comment : commentId , likedBy : userId})
        message = "comment liked successfully"
    }

    return res
        .status(200)
        .json(new ApiResponse(200 , null , message))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const {tweetId} = req.params
    const {userId} = req.user._id

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId,
    });

    let message;

    if (existingLike) {
        await existingLike.deleteOne()
        message = "Tweet unliked successfully"
    } else {
        await Like.create({ tweet: tweetId, likedBy: userId })
        message = "Tweet liked successfully"
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, message))

})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;

    const likedVideos = await Like.find({
        likedBy : userId,
        video : {$ne : null}
    }).populate("video" , "title description thumbnail url createdAt")

    const count = likedVideos.length;

    return res
        .status(200)
        .json(new ApiResponse(200, { likedVideos, count }, "Liked videos fetched successfully"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}