import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body
    const owner = req.user._id;

    if(!name || !description){
        throw new ApiError(400, "Name and description are required");
    }

    const createPlaylist = await Playlist.create({name , description , owner});

    return res
        .status(201)
        .json(new ApiResponse(201, createPlaylist, "Playlist created successfully"));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: userId }).populate("videos", "title thumbnail")

    return res
        .status(200)
        .json(new ApiResponse(200 , playlists , "Playlist fetched"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos")

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched"));

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Playlist 0r Video ID")
    }

    const playlist = await Playlist.findById(playlistId)

     if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if(!playlist.videos.includes(videoId)){
        playlist.videos.push(videoId)
        await playlist.save()
    }

    return res
        .status(201)
        .json(new ApiResponse(200, playlist, "Video added to playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
    const {playlistId, videoId} = req.params
     if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Playlist 0r Video ID")
    }

    const playlist = await Playlist.findById(playlistId)

     if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }


    playlist.videos = playlist.videos.filter(v => v.toString() !== videoId)
    await playlist.save()
    
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed from playlist"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Playlist deleted successfully"));

})

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID");
    }

    const updates = {}

    if(name?.trim()){
        updates.name = name;
    }

    if(description?.trim()){
        updates.description = description 
    }

      if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "No valid fields provided for update")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId, { $set: updates }, { new: true })

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}