import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../api/subscription.controller.js";



const router=Router()

router.use(verifyJWT)

router.route("/c/:username").post(toggleSubscription).get(getUserChannelSubscribers)

router.route("/s/:subscriberId").get(getSubscribedChannels)

export default router