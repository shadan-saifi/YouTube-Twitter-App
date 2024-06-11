import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, isPublished } = req.body
    const { videoId } = req.params

    if ([name, description, isPublished].some((field) => field?.trim?.() === "" || field === null || field === undefined)) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }


    let playlistData = {
        name: name,
        description: description,
        owner: user?._id,
        isPublished: isPublished === "true" ? true : false,
    };

    if (videoId && isValidObjectId(videoId)) {
        const isVideoExist = await Video.findById(videoId);

        if (isVideoExist) {
            playlistData.videos = [videoId];
        } else {
            throw new ApiError(404, "Video not found");
        }
    }

    const playlist = await Playlist.create(playlistData)

    if (!playlist) {
        throw new ApiError(404, "Error occurred while creating playlist")
    }

    res.status(200).json(new ApiResponse(200, playlist, "playlist created succesfully"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const isVideoExist = await Video.findById(videoId)

    if (!isVideoExist) {
        throw new ApiError(404, "Video not found")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }
    try {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $addToSet: { videos: videoId }, // Add videoId to the videos array if not already present
            },
            { new: true }
        );

        if (!updatedPlaylist) {
            throw new ApiError(404, "Playlist not found");
        }

        res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"));

    } catch (error) {

        throw new ApiError(401, error.message)
    }


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const isVideoExist = await Video.findById(videoId)

    if (!isVideoExist) {
        throw new ApiError(404, "Video not found")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    try {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull: { videos: videoId },
            },
            { new: true }
        );

        if (!updatedPlaylist) {
            throw new ApiError(404, "Playlist not found");
        }

        res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"));

    } catch (error) {

        throw new ApiError(401, error.message || "Error occurred while removing video from playlist")
    }


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }


    try {
        const playlistDelete = await Playlist.findByIdAndDelete(playlistId);

        if (!playlistDelete) {
            throw new ApiError(404, "Playlist not found");
        }

        res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"));

    } catch (error) {

        throw new ApiError(500, "Error occurred while deleting playlist");
    }

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description, isPublished } = req.body

    if (!name || !description || !isPublished) {
        throw new ApiError(400, "All fields are required")
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }
    try {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name,
                    description,
                    isPublished: isPublished === "true" ? true : false
                }
            },
            { new: true }
        );
        if (!updatedPlaylist) {
            throw new ApiError(404, "Playlist not found");
        }

        res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));

    } catch (error) {

        throw new ApiError(401, error.message)
    }



})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    try {
        const playlist = await Playlist.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [{ $project: { fullname: 1, username: 1, avatar: 1 } }]
                }
            },
            {
                $addFields: {
                    owner: { $first: "$owner" }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "allVideos",
                    pipeline: [{
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{ $project: { fullname: 1, username: 1, avatar: 1 } }]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                    ]
                }
            },
            {
                $addFields: {
                    totalVideos: { $size: "$allVideos" }
                }
            },
            {
                $addFields: {
                    totalViews: {
                        $sum: {
                            eachVideoViews: {
                                $map: {
                                    input: "$allVideos",
                                    as: "eachVideo",
                                    in: "$$eachVideo.views"
                                },
                            }
                        }
                    }

                }
            },

        ])
        if (!playlist || playlist.length === 0) {
            throw new ApiError(404, "Playlist not found");
        }

        if (playlist[0].videos.length === 0) {
            return res.status(404).json(new ApiResponse(404, {}, "Playlist is empty"));
        }
        res.status(200).json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))

    } catch (error) {
        throw new ApiError(404, error.message)

    }

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { username } = req.params
    const { page = 1, limit = 10, sortBy, sortType, isPublished } = req.query


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
    pipeline.push({
        $match: {
            owner: new mongoose.Types.ObjectId(user._id)
        }
    })
    if (isPublished) {
        pipeline.push({
            $match: {
                isPublished: isPublished === "true" ? true : false
            }
        })
    }

    pipeline.push(
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"playlistOwner",
                pipeline:[{ $project: { fullname: 1, username: 1, avatar: 1 } }]
            }
        },
        {
            $addFields:{
                playlistOwner:{$first:"$playlistOwner"}
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "allVideos",
                pipeline: [{
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [{ $project: { fullname: 1, username: 1, avatar: 1 } }]
                    }
                },
                {
                    $addFields: {
                        owner: { $first: "$owner" }
                    }
                }
                ]
            }
        },
        {
            $addFields: {
                TotalVideos: { $size: "$allVideos" }
            }
        },
        {
            $facet: {
                playlists: [
                    { $skip: (Page - 1) * Limit },
                    { $limit: Limit },
                    {
                        $sort: {
                            score: -1,
                            [sortBy]: sortType === 'asc' ? 1 : -1
                        }
                    }
                ],
                totalPlaylists: [
                    { $count: "count" }
                ]
            }
        }
    )

     try {
        const result = await Playlist.aggregate(pipeline)
        const playlists = result[0].playlists;
        const playlistsOnPage = playlists.length
        const totalPlaylists = result[0].totalPlaylists[0]?.count || 0;

        res.status(200).json(new ApiResponse(200, { playlists,playlistsOnPage, totalPlaylists }, "Playlists fetched successfully"))
    } catch (error) {
        throw new ApiError(401, error.message)
    }

})

export { createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist, getPlaylistById, getUserPlaylists }
