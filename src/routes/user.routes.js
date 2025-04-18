import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { unlinkFiles } from "../utils/unlinkFiles.js";

const router = Router();

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

export default router;
