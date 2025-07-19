import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    updateThumbnail,
    deleteVideo,
    togglePublishStatus,
} from "../controllers/video.controller.js";

import { ApiError } from "../utils/ApiError.js";
const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(updateVideo);

router
    .route("/update/thumbnail/:videoId")
    .patch(upload.single("thumbnail"), updateThumbnail);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

router.route("/test-error").post((req,res)=>{
   res.setHeader("Content-Type", "application/json");
    throw new ApiError(400, "This is a test error");
})
export default router;
