import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary , deleteFromCloudinary } from "../utils/cloudnary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination

    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const pageNumber = parseInt(page)
    const limitNumber  = parseInt(limit)
    const sortOrder = sortType == 'asc' ? 1 : -1;

    const filter = {isPublished : true}

    if(userId){
        filter.owner = new mongoose.Types.ObjectId(userId)
    }

    if(query){
        filter.$or = [
            {title : {$regex : query , $options : "i"}},
            {description : {$regex : query , $options : "i"}}
        ]
    }

    const sortOption = {
        [sortBy] : sortOrder
    }

    const videos = await Video.aggregate([
        {$match : filter},
        {$sort : sortOption},
        {$skip : (pageNumber - 1) * limitNumber},
        {$limit : limitNumber},
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                owner: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1
                }
            }
        }
    ])

    return res.status(200).json(
    new ApiResponse(200, videos, "Videos fetched successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    
    const { title, description} = req.body
    const {videoFile , thumbnail} = req.files;

    if (!videoFile || !thumbnail || !title || !description) {
        throw new ApiError(400, "All fields are required");
    }

    const uploadedVideo = await uploadOnCloudinary(videoFile[0].path , "video")
    const uploadedThumbnail = await uploadOnCloudinary(thumbnail[0].path)

    if(!uploadedVideo.url || !uploadedThumbnail.url){
        throw new ApiError(500, "File upload failed")
    }

    const video = await Video.create({
        title,
        description,
        videoFile : uploadedVideo.url,
        thumbnail : uploadedThumbnail.url,
        duration : uploadedVideo.duration || 0,
        owner: req.user._id
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while creating the video");
    }

    return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));

})

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id

    const { videoId } = req.params

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID"); 
    }

    const video = await Video.findOneAndUpdate(
        {_id : videoId , isPublished : true},
        {$inc : {views : 1}},
        {new : true}
    ).populate("owner" , "_id username fullName avatar")

    if (!video) {
    throw new ApiError(404, "Video not found or not published");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params
    const {title , description} = req.body
    const {thumbnail} = req.files || {}

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to update this video");
    }

    if(thumbnail && thumbnail[0]){
        const uploadedThumbnail = await uploadOnCloudinary(thumbnail[0].path)
        if(!uploadedThumbnail?.url){
            throw new ApiError(500, "Thumbnail upload failed");
        }
        video.thumbnail = uploadedThumbnail.url
    }

    if(title){
        video.title = title;
    }

    if(description){
        video.description = description;
    }

    await video.save()
    
    return res.status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video

    const { videoId } = req.params

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    //Delete video file from Cloudinary
     await deleteFromCloudinary(video.videoFile, "video");
    //Delete thumbnail image from Cloudinary
    await deleteFromCloudinary(video.thumbnail, "image");

    await video.deleteOne();

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to modify this video")
    }

    //toggle 
    video.isPublished = !video.isPublished
    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(200, video, `Video has been ${video.isPublished ? "published" : "unpublished"} successfully`))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}