import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";


const router = Router()
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file


router.route("/")
    .get(getAllVideos)
    .post(
        upload.fields(
            [
                {
                    name: "videoFile",
                    maxCount: 1
                },
                {
                    name: "thumbnail",
                    maxCount: 1
                }
            ]
        ),
        publishVideo
    )
router.route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("thumbnail"), updateVideo)
    .delete(deleteVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router