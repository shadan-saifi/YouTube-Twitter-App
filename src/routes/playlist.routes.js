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
} from "../api/playlist.controller.js";




const router = Router()

router.use(upload.none())

router.route("/create-playlist/:videoId?").post(verifyJWT,createPlaylist)

router.route("/:playlistId")
    .patch(verifyJWT,updatePlaylist)
    .delete(verifyJWT,deletePlaylist)
    .get(getPlaylistById)

router.route("/add/:playlistId/:videoId").patch(verifyJWT,addVideoToPlaylist)
router.route("/remove/:playlistId/:videoId").patch(verifyJWT,removeVideoFromPlaylist)

router.route("/user/:username").get(getUserPlaylists)



export default router