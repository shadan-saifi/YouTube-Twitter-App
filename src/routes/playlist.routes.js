import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";




const router = Router()

router.use(verifyJWT, upload.none())

router.route("/create-playlist/:videoId?").post(createPlaylist)

router.route("/:playlistId")
    .patch(updatePlaylist)
    .delete(deletePlaylist)
    .get(getPlaylistById)

router.route("/add/:playlistId/:videoId").patch(addVideoToPlaylist)
router.route("/remove/:playlistId/:videoId").patch(removeVideoFromPlaylist)

router.route("/user/:userId").get(getUserPlaylists)



export default router