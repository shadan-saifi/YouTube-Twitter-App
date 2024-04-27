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


        const totalLikes = await Like.countDocuments({
            video: {
                $in: await Video.find({ owner: user?._id })
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

    const { page = 1, limit = 10, sortBy = "title", sortType = "asc", username, isPublished, query } = req.query

    if (!username) {
        throw new ApiError(400, "Username is missing")
    }

    const user = await User.findOne({ username: username });
    if (!user) {
        throw new ApiError(400, "user not found")
    }

    const Page = parseInt(page);
    const Limit = parseInt(limit);

    const pipeline = [];

    if (query) {
        pipeline.push({
            $search: {
                "index": "title-description-search",
                'compound': {
                    'should': [
                        {
                            "autocomplete": {
                                "query": query,
                                "path": "title",
                                "tokenOrder": "any",
                                "fuzzy": {
                                    "maxEdits": 1,
                                    "prefixLength": 1,
                                    "maxExpansions": 256
                                }
                            }
                        },
                        {
                            "autocomplete": {
                                "query": query,
                                "path": "description",
                                "tokenOrder": "any",
                                "fuzzy": {
                                    "maxEdits": 1,
                                    "prefixLength": 1,
                                    "maxExpansions": 256
                                }
                            }
                        }
                    ],
                    'minimumShouldMatch': 1
                }
            }
        });
    }

    pipeline.push({
        $match: {
            owner: new mongoose.Types.ObjectId(user?._id)
        }
    });

    // Conditionally apply isPublished filter
    if (isPublished) {
        pipeline.push({
            $match: {
                isPublished: isPublished === "true" ? true : false
            }
        });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerOfVideo",
                pipeline: [{
                    $project: {
                        fullname: 1,
                        username: 1,
                        avatar: 1
                    }
                }]
            },
        },
        {
            $addFields: {
                ownerOfVideo: { $first: "$ownerOfVideo" },
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                ownerOfVideo: 1,
                isPublished: 1,
                thumbnail: 1,
                totalComments: { $size: "$comments" },
                totalLikes: { $size: "$likes" },
                score: { $meta: "searchScore" }
            }
        },
        {
            $facet: {
                videos: [
                    { $skip: (Page - 1) * Limit },
                    { $limit: Limit },
                    {
                        $sort: {
                            score: -1,
                            [sortBy]: sortType === 'asc' ? 1 : -1
                        }
                    }
                ],
                totalVideos: [
                    { $count: "count" }
                ]
            }
        }

    )

    const result = await Video.aggregate(pipeline)
    try {
        const videos = result[0].videos;
        const videosOnPage = videos.length
        const totalVideos = result[0].totalVideos[0]?.count || 0;


        return res.status(200).json(new ApiResponse(200, { videos, videosOnPage, totalVideos }, "Videos list fetched successfully"));
    } catch (error) {
        throw new ApiError(400, error.message || "Something went wrong");
    }
})

export { getChannelStats, getChannelVideos }