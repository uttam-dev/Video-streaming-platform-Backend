import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
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

//test
router.route("/auth/test").post(verifyJWT, (req, res) => {
    res.end("Access !!!!!!!!");
});

export default router;
