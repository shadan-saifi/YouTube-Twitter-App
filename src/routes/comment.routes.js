import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {  addTweetComment, addVideoComment,  addreply,  deleteCommentAndReply, getAllReplies, getTweetComments, getVideoComments,  updateCommentAndreply } from "../controllers/comment.controller.js";



const router=Router()

router.use(verifyJWT)

router.route("/v/:videoId").post(addVideoComment).get(getVideoComments)
router.route("/t/:tweetId").post(addTweetComment).get(getTweetComments)

router.route("/c/:commentId").patch(updateCommentAndreply).delete(deleteCommentAndReply)
router.route("/r/:commentId").post(addreply).get(getAllReplies)



export default router