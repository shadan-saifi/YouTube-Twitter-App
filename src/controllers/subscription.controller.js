import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const { username } = req.params

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "user not found");
    }

    if (!username) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.findOne({ username: username });
    if (!channel) {
        throw new ApiError(401, "channel does not exist")
    }

    try {
        const isSubscribedTo = await Subscription.findOne({
            channel: channel?._id,
            subscriber: user?._id
        })

        if (!isSubscribedTo) {
            const createSubscription = await Subscription.create({
                channel: channel?._id,
                subscriber: user?._id
            })
            if (!createSubscription) {
                throw new ApiError(404, "Error while subscribing");
            }

            res.status(200).json(new ApiResponse(200, createSubscription, "Subscribed to channel successfully"))
        } else {
            const removeSubscription = await Subscription.findOneAndDelete({
                channel: channel?._id,
                subscriber: user?._id
            })
            if (!removeSubscription) {
                throw new ApiError(404, "Error while unsubscribing");
            }
            res.status(200).json(new ApiResponse(200, removeSubscription, "Unsubscribed to channel successfully"))

        }
    } catch (error) {
        throw new ApiError(404, error.message)
    }


})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "invalid channel ID")
    }
    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(401, "channel does not exist")
    }

    try {
        const listSubscribers = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriberInfo",
                    pipeline: [{$project:{ fullname: 1, username: 1, avatar: 1 }}],
                }
            },
            {
                $addFields: {
                    subscriberInfo: { $first: "$subscriberInfo" }
                }
            },
            {
                $project:{
                    subscriberInfo:1
                }
            }
        ])

        if (listSubscribers.length === 0) {
            return res.status(200).json(new ApiResponse(200, listSubscribers, "No subscriber yet"))
        }

        return res.status(200).json(new ApiResponse(200, listSubscribers, "List of subscribers fetched"))

    } catch (error) {
        throw new ApiError(404, error.message)
    }

})

const getSubscribedChannels =asyncHandler(async(req,res)=>{
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(401, "invalid subscriber ID")
    }
    const subscriber = await User.findById(subscriberId);

    if (!subscriber) {
        throw new ApiError(401, "subscriber does not exist")
    }

    try {
        const listChannels=await Subscription.aggregate([
            {
                $match:{
                    subscriber:new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
               $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channelsSubscribedTo",
                pipeline: [{$project:{ fullname: 1, username: 1, avatar: 1 }}],
            } 
            },
            {
                $addFields: {
                    subscriberInfo: { $first: "$subscriberInfo" }
                }
            },
            {
                $project:{
                    channelsSubscribedTo:1
                }
            }
        ])

        if (listChannels.length === 0) {
            return res.status(200).json(new ApiResponse(200, listChannels, "No channel subscribed yet"))
        }

        return res.status(200).json(new ApiResponse(200, listChannels, "List of channels subscribed fetched successfully"))
    } catch (error) {
        throw new ApiError(404, error.message)
        
    }
})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }