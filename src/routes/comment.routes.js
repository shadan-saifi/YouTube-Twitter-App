import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {  addTweetComment, addVideoComment,  addreply,  deleteCommentAndReply, getAllReplies, getTweetComments, getVideoComments,  updateCommentAndreply } from "../api/comment.controller.js";



const router=Router()


router.route("/v/:videoId").post(verifyJWT,addVideoComment).get(getVideoComments)
router.route("/t/:tweetId").post(verifyJWT,addTweetComment).get(getTweetComments)

router.route("/c/:commentId").patch(verifyJWT,updateCommentAndreply).delete(verifyJWT,deleteCommentAndReply)
router.route("/r/:commentId").post(verifyJWT,addreply).get(getAllReplies)



export default router