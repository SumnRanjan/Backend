import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId  = req.user._id;

    const userVideos = await Video.findById({owner : userId}).select("_id")
    const videoIds = userVideos.map((v) =>  v._id)

    const[totalVideos , totalLikes , totalViews , totalSubscribers] = await Promise.all([
        Video.countDocuments({owner :  userId}),
        Like.countDocuments({video : {$in : videoIds}}),
        Video.aggregate([
            {$match : {owner : userId}},
            {$group : {_id : null , total : { $sum : "$views"}}}
        ]),
        Subscription.countDocuments({ channel: userId })
    ])

    const views = totalViews.length > 0 ? totalViews[0].total : 0

    return res
        .status(200)
        .json(new ApiResponse(200, {totalVideos,totalLikes,totalViews: views,totalSubscribers}, "Channel statistics fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id

    const videos = await Video.find({owner : userId})
        .select("title description thumbnail views createdAt duration isPublished")
        .sort({ createdAt: -1 })
    
    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})


export {
    getChannelStats, 
    getChannelVideos
    }