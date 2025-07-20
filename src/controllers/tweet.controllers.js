import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const owner = req.user._id

    if(!content || !content.trim()){
        throw new ApiError(400, "Tweet content is required")
    }

    const tweet = await Tweet.create({content , owner})

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID")
    }

    const tweets = (await Tweet.find({owner : userId})).sort({createdAt : -1})

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets fetched"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    const userId = req.user._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "Tweet content is required for update")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Not authorized to update this tweet")
    }

    tweet.content = content;
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    const userId = req.user._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Not authorized to delete this tweet")
    }

    await tweet.deleteOne()

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tweet deleted successfully"))
    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}