import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(401, "All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    let videoFile = "";
    if (req.files.videoFile[0].size <= 100 * 1024 * 1024) {
        videoFile = await uploadOnCloudinary(videoFileLocalPath)
    } else {
        throw new ApiError(400, "upload video less than or equal 100 MB")
    }
    if (!videoFile) {
        throw new ApiError(400, "Error nwhile uploading video on cloudinary")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail) {
        throw new ApiError(400, "Error nwhile uploading thumbnail on cloudinary")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const video = await Video.create({
        videoFile: {
            url: videoFile.url,
            secure_url: videoFile.secure_url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            secure_url: thumbnail.secure_url,
            public_id: thumbnail.public_id
        },
        title: title,
        description,
        duration: videoFile.duration,
        views: 0,
        owner: user._id
    })

    const createdVideo = await Video.findById(video._id)
    if (!createdVideo) throw new ApiError(400, "something went wrong with server while publishing video")

    res.status(200).json(new ApiResponse(200, createdVideo, "video published succesfully"))

})

const getSearchedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, /*userId*/ } = req.query

    // if (!isValidObjectId(userId)) {
    //     throw new ApiError(401, "Invalid user ID")
    // }
    if (!query || !sortBy || !sortType) {
        throw new ApiError(400, "all fields are required")
    }

    // const user =await User.findById(userId)
    // if (!user) {
    //     throw new ApiError(400, "user not found")
    // }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    await Video.createIndexes({ title: "text", description: "text" });
    const allVideos = await Video.aggregate([
        {
            $match: {
                $text: { $search: query }
            }
        },
        {
            $sort: {
                score: { $meta: "textScore" },
                [sortBy]: sortType === 'asc' ? 1 : -1
            }
        },
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
        }

    ])

    try {
        const listVideos = await Video.aggregatePaginate(allVideos, options)
        if (listVideos.docs.length === 0) {
            return res.status(200).json(new ApiResponse(200, {}, "No videos to show"))
        } else {
            return res.status(200).json(new ApiResponse(200, listVideos, "videos list fetched successfully"))
        }

    } catch (error) {
        throw new ApiError(400, error.message || "something went wrong with paginationn")
    }
})

const getAllUserVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy, sortType, isPublished, username } = req.query

    if (!username) {
        throw new ApiError(400, "Username is missing")
    }
    const user = await User.findOne({ username: username });
    if (!user) {
        throw new ApiError(400, "user not found")
    }
    const Page = parseInt(page);
    const Limit = parseInt(limit);

    const result = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user?._id),
                isPublished: isPublished === "true" ? true : false

            }
        },
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
            $facet: {
                videos: [
                    { $skip: (Page - 1) * Limit },
                    { $limit: Limit },
                    {
                        $sort: { [sortBy]: sortType === "asc" ? 1 : -1 }
                    }
                ],
                totalVideos: [
                    { $count: "count" }
                ]
            }
        },
    ])

    try {
        const videos = result[0].videos;
        const videosOnPage = videos.length
        const totalVideos = result[0].totalVideos[0]?.count || 0;

        if (videos.length === 0) {
            return res.status(200).json(new ApiResponse(200, {}, "User does not have videos"));
        } else {
            return res.status(200).json(new ApiResponse(200, { videos, videosOnPage, totalVideos }, "Videos list fetched successfully"));
        }
    } catch (error) {
        throw new ApiError(400, error.message || "Something went wrong");
    }
})

const getUserSearchedVideos = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, sortBy, sortType, username, isPublished, query } = req.query

    if (!username) {
        throw new ApiError(400, "Username is missing")
    }

    if (!query || !sortBy || !sortType) {
        throw new ApiError(400, "all fields are required")
    }

    const user = await User.findOne({ username: username });
    if (!user) {
        throw new ApiError(400, "user not found")
    }

    const Page = parseInt(page);
    const Limit = parseInt(limit);

    const result = await Video.aggregate([
        {
            '$search': {
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
        },
        {
            $match: {
                owner: new mongoose.Types.ObjectId(user?._id),
                isPublished: isPublished === "true" ? true : false
            }
        },
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
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                ownerOfVideo: 1,
                isPublished: 1,
                "thumbnail.url": 1,
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

    ])
    try {
        const videos = result[0].videos;
        const videosOnPage = videos.length
        const totalVideos = result[0].totalVideos[0]?.count || 0;

        if (videos.length === 0) {
            return res.status(200).json(new ApiResponse(200, {}, "Videos not found "));
        } else {
            return res.status(200).json(new ApiResponse(200, { videos, videosOnPage, totalVideos }, "Videos list fetched successfully"));
        }
    } catch (error) {
        throw new ApiError(400, error.message || "Something went wrong");
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    console.log("get video by id", videoId);
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const isVideoExist = await Video.findById(videoId)

    if (!isVideoExist) {
        throw new ApiError(404, "Video not found")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            },
        },
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
                },
                subscribersCount: {
                    $size: "$subscribers"
                },
                likesCount: {
                    $size: "$likes"
                },
                commentsCount: {
                    $size: "$comments"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                },

            }
        },
        {
            $project: {
              
                subscribers:0
            }
        }

    ])
    console.log("video Details:", video);
    if (!video.length) {
        throw new ApiError(404, "video not found");
    }

    return res.status(200).json(new ApiResponse(200, video[0], "video fetched succesfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");

    }

    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(401, "All fields are required")
    }

    const oldVideo = await Video.findById(videoId)

    const thumbnailLocalPath = req.file?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file is required");
    }
    if (!oldVideo) {
        throw new ApiError(404, "video not found");
    }

    const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnailResponse) {
        throw new ApiError(400, "Error while uploading on cloudinary");
    }
    console.log("thumbnail updated successfully", thumbnailResponse.url);

    const thumbnailPublicId = oldVideo.thumbnail.public_id
    const deleteThumbnail = await deleteFromCloudinary(thumbnailPublicId, "image")
    if (!deleteThumbnail) {
        throw new ApiError(400, "Error while deleting file from cloudinary");
    }

    const response = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                title: title,
                description,
                thumbnail: {
                    url: thumbnailResponse.url,
                    secure_url: thumbnailResponse.secure_url,
                    public_id: thumbnailResponse.public_id
                },
            },
            $inc: {
                views: 1
            }

        }, { new: true }
    )
    if (!response) {
        throw new ApiError(401, "Error occurred while updating video")
    }

    res.status(200).json(new ApiResponse(200, response, "video details updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const oldVideo = await Video.findById(videoId)
    if (!oldVideo) {
        throw new ApiError(401, "Video not found")
    }
    const videoPublicId = oldVideo?.videoFile.public_id
    const thumbnailPulicId = oldVideo?.thumbnail.public_id

    const deletingVideoFromCloudinary = await deleteFromCloudinary(videoPublicId, "video")
    const deletingThumbnailFromCloudinary = await deleteFromCloudinary(thumbnailPulicId, "image")

    if (!deletingVideoFromCloudinary || !deletingThumbnailFromCloudinary) {
        throw new ApiError(400, "error while deleting files from cloudinary")
    }

    const response = await Video.findByIdAndDelete(videoId)
    if (!response) {
        throw new ApiError(400, "Error while deleting video")
    }

    res.status(200).json(new ApiResponse(200, {}, "Video file deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(401, "Video not found")
    }

    video.isPublished = !video.isPublished

    const updatedVideo = await video.save({ validateBeforeSave: false });
    if (!updatedVideo) {
        throw new ApiError(400, "error while updating video");
    }

    res.status(200).json(new ApiResponse(200, updatedVideo, "Publish status toggled successfully"));
})

export { publishVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus, getSearchedVideos, getAllUserVideos, getUserSearchedVideos }