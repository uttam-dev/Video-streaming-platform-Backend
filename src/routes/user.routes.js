import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { unlinkFiles } from "../utils/unlinkFiles.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Register
router.route("/register").post(
    upload.fields([
        {
            name: "coverImage",
            maxCount: 1,
        },
        {
            name: "avatar",
            maxCount: 1,
        },
    ]),
    registerUser,
    unlinkFiles
);

// Login
router.route("/login").post(loginUser);

//logout
router.route("/logout").post(verifyJWT, logoutUser);

//refresh access token
router.route("/auth/refresh-token").post(refreshAccessToken);

//update avatar
router
    .route("/update/avatar")
    .post(verifyJWT,upload.single("avatar"), updateUserAvatar);

//update avatar
router
    .route("/update/coverImage")
    .post(verifyJWT,upload.single("coverImage"), updateUserCoverImage);

//get current user
router.route("/current-user").post(verifyJWT,getCurrentUser);

//test
router.route("/auth/test").post(verifyJWT, (req, res) => {
    res.end("Access !!!!!!!!");
});

export default router;
