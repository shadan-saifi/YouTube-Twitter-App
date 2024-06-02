import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    console.log("content:",content);
    console.log("req.body:",req.body);


    if (!content) {
        throw new ApiError(400, "Content field is required")
    }
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const tweet = await Tweet.create({
        content,
        owner: user._id
    })

    if (!tweet) {
        throw new ApiError(400, "Error  occurred while creating tweet")
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created Successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {
                content
            }
        }, { new: true }
    )

    if (!updatedTweet) {
        throw new ApiError(400, "Tweet not found")
    }

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated Successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const tweetdelete=await Tweet.findByIdAndDelete(tweetId)

    if (!tweetdelete) {
        throw new ApiError(400, "Tweet not found")
    }

    return res.status(200).json(new ApiResponse(200, tweetId, "Tweet deleted Successfully"))


})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 5 } = req.query;


    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };
    const allTweets=Tweet.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(user._id)
            }

        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[{
                    $project:{fullname:1, username:1,avatar:1}
                }]
            }
        },
       {
        $addFields:{
            owner:{
                $first:"$owner"
            }
        }
       }
        
    ])
    try {
        const listTweets=await Tweet.aggregatePaginate(allTweets,options)
        if (!listTweets) {
            return res.status(200).json(new ApiResponse(200, listTweets, "No tweets to show currently"))
        }
    
        return res.status(200).json(new ApiResponse(200, listTweets, "All tweets fetched Successfully"))
    } catch (error) {
        throw new ApiError(404, error.message || "Error occurred while fetching the tweets")
    }

})


export { createTweet, updateTweet, deleteTweet, getUserTweets }