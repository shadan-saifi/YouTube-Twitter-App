import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const { videoId } = req.params

    if ([name, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }


    let playlistData = {
        name:name,
        description:description,
        owner: user?._id,
    };

    if (videoId && isValidObjectId(videoId)) {
        const isVideoExist = await Video.findById(videoId);

        if (isVideoExist) {
            playlistData.videos = [videoId];
        } else {
            throw new ApiError(404, "Video not found");
        }
    }

    const playlist = await Playlist.create(playlistData )

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

        throw new ApiError(401, error.message)
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
    const { name, description } = req.body

    if (!name || !description) {
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
                    description
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
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    try {
        const allPlaylists = await Playlist.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
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
            }
        ])
        if (!allPlaylists) {
            res.status(200).json(new ApiResponse(200, allPlaylists, "User do not hane any playlists to show"))
        }

       
        res.status(200).json(new ApiResponse(200, allPlaylists, "All Playlists fetched successfully"))
    } catch (error) {
        throw new ApiError(401, error.message)
    }

})

export { createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist, getPlaylistById, getUserPlaylists }
