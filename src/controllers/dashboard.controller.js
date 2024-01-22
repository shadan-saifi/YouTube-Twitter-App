import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";


const getChannelStats = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    try {
        const totalViewsAndVideos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(user._id)
                }
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalVideos: { $sum: 1 }
                }
            }
        ])
      

        const totalSubscribers = await Subscription.countDocuments({ channel: user._id })
     

        const totalLikes=await Like.countDocuments({
            video:{
                $in:await Video.find({owner:user?._id})
            }
        })

      


        return res.status(200).json(new ApiResponse(200, {
            totalViewsAndVideos: totalViewsAndVideos[0],
            totalSubscribers,
            totalLikes
        }, "success"))

    } catch (error) {
        throw new ApiError(401, error.message)
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    try {
        
        const videos = await Video.find({owner:user?._id})
        return res.status(200).json(new ApiResponse(200, videos, "All videos fetchedsuccessfully"))
    } catch (error) {
        throw new ApiError(401, error.message)
    }

})

export { getChannelStats,getChannelVideos }