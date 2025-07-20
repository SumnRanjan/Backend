import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params
    const subscriberId = req.user._id;

    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }

    if(channelId.toString() === subscriberId.toString()){
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channel = await User.findById(channelId)

    if(!channel){
        throw new ApiError(404, "Channel not found")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber : subscriberId,
        channel : channelId,
    })

    let message;

    if(existingSubscription){
        await existingSubscription.deleteOne()
        message = "Unsubscribed successfully"
    }else{
        await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });
        message = "Subscribed successfully";
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , null , message))
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find(
        {channel : channelId}
    ).populate("subscriber", "username fullName avatar")

    const count = subscribers.length;

    return res
        .status(200)
        .json(new ApiResponse(200, {subscribers , count}, "Channel subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!mongoose.isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid channel ID");
    }

    const channels = await Subscription.find(
        {subscriber : subscriberId}
    ).populate("channel", "username fullName avatar")

    const count = channels.length;

    return res
        .status(200)
        .json(new ApiResponse(200, {channels , count}, "Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}