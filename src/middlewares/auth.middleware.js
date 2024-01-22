import  jwt  from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import cookieParser from "cookie-parser";


export const verifyJWT=asyncHandler(async(req,_,next)=>{
    try {
        console.log("req.cookies:",req.cookies);
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        console.log("token:",token);
        if (!token) {
            throw new ApiError(401,"Unauthorized Request")
        }
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401,"Invalid Access Token")
        }
        req.user=user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")

    }
})