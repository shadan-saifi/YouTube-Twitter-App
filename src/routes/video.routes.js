import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllUserVideos, getAllVideos, getSearchedVideos, getUserSearchedVideos, getVideoById, publishVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";


const router = Router()


router.route("/")
    .get(getAllUserVideos)
    .post(verifyJWT,
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
router.route("/all-videos").get(getAllVideos)
router.route("/search-videos").get(getSearchedVideos)
router.route("/user-search-videos").get(getUserSearchedVideos);

router.route("/:videoId")
    .get(getVideoById)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo)
    .delete(verifyJWT, deleteVideo)

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router