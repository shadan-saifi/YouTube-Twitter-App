import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.model.js";



const addVideoComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    console.log("req.body:", req.body);

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(402, "Invalid video Id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    if (!content) {
        throw new ApiError(402, "content is required")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: user?._id
    })
    if (comment) {
        return res.status(200).json(new ApiResponse(200, comment, "comment created successfully"))

    } else {
        throw new ApiError(401, "Error while creating the comment")
    }
})
const addTweetComment = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(402, "Invalid tweet Id")
    }

    if (!content) {
        throw new ApiError(402, "content is required")
    }
    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const comment = await Comment.create({
        content,
        tweet: tweetId,
        owner: user?._id
    })
    if (comment) {
        return res.status(200).json(new ApiResponse(200, comment, "comment created successfully"))

    } else {
        throw new ApiError(401, "Error while creating the comment")
    }
})

const updateCommentAndreply = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(402, "Invalid video Id")
    }

    if (!content) {
        throw new ApiError(402, "Enter comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
        $set: {
            content
        }
    }, { new: true }
    )

    if (!updatedComment) {
        throw new ApiError(402, "Error while updating the comment")
    }

    return res.status(200).json(new ApiResponse(200, updatedComment, "comment updated successfully"))

})

const deleteCommentAndReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(402, "Invalid comment Id")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if (!deletedComment) {
        throw new ApiError(402, "Error while deleting the comment")
    }
    return res.status(200).json(new ApiResponse(200, deletedComment, "commment deleted successfully"))
})
 
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(402, "Invalid video Id")
    }

    const isVideoExists = await Video.findById(videoId);

    if (!isVideoExists) {
        throw new ApiError(404, "video not found");
    }

    const Page = parseInt(page);
    const Limit = parseInt(limit);

    const result = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerOfComment",
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
                ownerOfComment: { $first: "$ownerOfComment" },
            }
        },
        {
            $facet: {
                comments: [
                    { $skip: (Page - 1) * Limit },
                    { $limit: Limit },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    }
                ],
                totalComments: [
                    { $count: "count" }
                ]
            }
        },

    ])

    try {
        const comments = result[0].comments;
        const commentsOnPage = comments.length
        const totalComments = result[0].totalComments[0]?.count || 0;

        if (comments.length === 0) {
            return res.status(200).json(new ApiResponse(200, {}, "User does not have comments"));
        } else {
            return res.status(200).json(new ApiResponse(200, { comments, commentsOnPage, totalComments }, "Comments fetched successfully"));
        }
    } catch (error) {
        throw new ApiError(400, error.message || "Something went wrong");
    }
})

const getTweetComments = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(402, "Invalid tweet Id")
    }

    const isTweetExists = await Tweet.findById(tweetId);

    if (!isTweetExists) {
        throw new ApiError(404, "tweet not found");
    }

    const Page = parseInt(page);
    const Limit = parseInt(limit);

    const result = await Comment.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId)
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerOfComment",
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
                ownerOfComment: { $first: "$ownerOfComment" },
            }
        },
        {
            $facet: {
                comments: [
                    { $skip: (Page - 1) * Limit },
                    { $limit: Limit },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    }
                ],
                totalComments: [
                    { $count: "count" }
                ]
            }
        },

    ])

    try {
        const comments = result[0].comments;
        const commentsOnPage = comments.length
        const totalComments = result[0].totalComments[0]?.count || 0;

        if (comments.length === 0) {
            return res.status(200).json(new ApiResponse(200, {}, "User does not have comments"));
        } else {
            return res.status(200).json(new ApiResponse(200, { comments, commentsOnPage, totalComments }, "Comments fetched successfully"));
        }
    } catch (error) {
        throw new ApiError(400, error.message || "Something went wrong");
    }
})

const addreply = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    console.log("req.body:", req.body);

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(402, "Invalid comment Id")
    }

    const isCommentexist = await Comment.findById(commentId)

    if (!isCommentexist) {
        throw new ApiError(404, "Comment not found");
    }

    if (!content) {
        throw new ApiError(402, "content is required")
    }

    const reply = await Comment.create({
        content,
        comment: commentId,
        owner: user?._id
    })

    if (reply) {
        return res.status(200).json(new ApiResponse(200, reply, "Reply created successfully"))

    } else {
        throw new ApiError(401, "Error while generating the reply")
    }
})

const getAllReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(commentId)) {
        throw new ApiError(402, "Invalid comment Id")
    }

    const isCommentExists = await Comment.findById(commentId);

    if (!isCommentExists) {
        throw new ApiError(404, "Comment not found");
    }

    const Page = parseInt(page);
    const Limit = parseInt(limit);

    const result = await Comment.aggregate([
        {
            $match: {
                comment: new mongoose.Types.ObjectId(commentId)
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerOfReply",
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
                ownerOfReply: { $first: "$ownerOfReply" },
            }
        },
        {
            $facet: {
                replies: [
                    { $skip: (Page - 1) * Limit },
                    { $limit: Limit },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    }
                ],
                totalReplies: [
                    { $count: "count" }
                ]
            }
        },

    ])

    try {
        const replies = result[0].replies;
        const repliesOnPage = replies.length
        const totalReplies = result[0].totalReplies[0]?.count || 0;

        if (replies.length === 0) {
            return res.status(200).json(new ApiResponse(200, {}, "User does not have replies"));
        } else {
            return res.status(200).json(new ApiResponse(200, { replies, repliesOnPage, totalReplies }, "Replies fetched successfully"));
        }
    } catch (error) {
        throw new ApiError(400, error.message || "Something went wrong");
    }
})

export { addVideoComment, addTweetComment, updateCommentAndreply, deleteCommentAndReply, getVideoComments, getTweetComments, addreply, getAllReplies }

