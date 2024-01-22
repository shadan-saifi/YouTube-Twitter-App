import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";



const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "user not found");
    }


    const isVideoExists = await Video.findById(videoId);

    if (!isVideoExists) {
        throw new ApiError(404, "video not found");
    }


    try {
        const isVideoLiked = await Like.findOne({
            video: videoId,
            likedBy: user._id
        })
        if (isVideoLiked) {
            const like = await Like.findOneAndDelete({
                video: videoId,
                likedBy: user._id
            })

            if (!like) {
                throw new ApiError(401, "Error while unliking video")
            }

            return res.status(200).json(new ApiResponse(200, like, "video unliked successfully"))

        } else {
            const like = await Like.create({
                video: videoId,
                likedBy: req.user._id
            })
            if (!like) {
                throw new ApiError(401, "Error while liking video")
            }

            return res.status(200).json(new ApiResponse(200, like, "video liked successfully"))

        }

    } catch (error) {
        throw new ApiError(401, error.message)
    }


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "user not found");
    }


    const isCommentExists = await Comment.findById(commentId);

    if (!isCommentExists) {
        throw new ApiError(404, "comment not found");
    }


    try {
        const isCommentLiked = await Like.findOne({
            comment: commentId,
            likedBy: user._id
        })
        if (isCommentLiked) {
            const like = await Like.findOneAndDelete({
                comment: commentId,
                likedBy: user._id
            })

            if (!like) {
                throw new ApiError(401, "Error while unliking comment")
            }

            return res.status(200).json(new ApiResponse(200, like, "Comment unliked successfully"))

        } else {
            const like = await Like.create({
                comment: commentId,
                likedBy: req.user._id
            })
            if (!like) {
                throw new ApiError(401, "Error while liking comment")
            }

            return res.status(200).json(new ApiResponse(200, like, "Comment liked successfully"))

        }

    } catch (error) {
        throw new ApiError(401, error.message)
    }


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "user not found");
    }


    const isTweetExists = await Tweet.findById(tweetId);

    if (!isTweetExists) {
        throw new ApiError(404, "Tweet not found");
    }


    try {
        const isTweetLiked = await Like.findOne({
            tweet: tweetId,
            likedBy: user._id
        })

        if (isTweetLiked) {
            const like = await Like.findOneAndDelete({
                tweet: tweetId,
                likedBy: user._id
            })

            if (!like) {
                throw new ApiError(401, "Error while unliking tweet")
            }

            return res.status(200).json(new ApiResponse(200, like, "Tweet unliked successfully"))


        } else {
            const like = await Like.create({
                tweet: tweetId,
                likedBy: req.user._id
            })
            if (!like) {
                throw new ApiError(401, "Error while liking tweet")
            }

            return res.status(200).json(new ApiResponse(200, like, "Tweet liked successfully"))
        }

    } catch (error) {
        throw new ApiError(401, error.message)
    }


})


const getLikedVideos = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "user not found");
    }
    const allLikedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(user._id),
                video: {
                    $exists: true
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
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
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likedVideo: {
                    $first: "$likedVideo"
                }
            }
        },

        // {
        //     $project: {
        //         likedVideo: 1,
        //     },
        // },

    ])

    if (allLikedVideos.length === 0) {
        new ApiResponse(200, "No liked videos found");
    }
    res.status(200).json(new ApiResponse(200, allLikedVideos, "all liked videos fetched successfully"))
})

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos }