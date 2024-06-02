import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../api/tweet.controller.js";
import { upload } from "../middlewares/multer.middleware.js";



const router=Router()

router.use( upload.none())

router.route("/create-tweet").post(verifyJWT,createTweet)
router.route("/user/:userId").get(verifyJWT,getUserTweets)
router.route("/:tweetId").patch(verifyJWT,updateTweet).delete(verifyJWT,deleteTweet)


export default router