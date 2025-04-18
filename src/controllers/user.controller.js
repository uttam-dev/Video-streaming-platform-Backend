import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
    deleteFilesOnCloudanary,
    uploadFileOnCloudanary,
} from "../services/cloudinary.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import { unlinkFiles } from "../utils/unlinkFiles.js";

const registerUser = asyncHandler(async (req, res, next) => {
    const { username, fullName, email, password } = req.body;

    //validation-----------------
    if (
        [username, fullName, email, password].some((fields) => {
            return fields === undefined || fields.trim() === "";
        })
    ) {
        unlinkFiles(req);
        throw new ApiError(400, "all fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        unlinkFiles(req);
        throw new ApiError(409, "username or email already exist");
    }

    //check image / avtar
    const avatarLocalPath = req?.files?.avatar?.[0]?.path || null;

    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        unlinkFiles(req);
        throw new ApiError(400, "avtar is required");
    }

    // upload Files On Cloudanary
    const avatar = await uploadFileOnCloudanary(avatarLocalPath);
    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadFileOnCloudanary(coverImageLocalPath);
    }

    if (!avatar) {
        unlinkFiles(req);
        throw new ApiError(400, "avtar is required");
    }

    //create user
    const user = await User.create({
        username,
        fullName,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    //check user create or not
    //remove pass and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password  -refreshToken -watchHistory"
    );

    if (!createdUser) {
        const response = await deleteFilesOnCloudanary([
            avatar.public_id,
            coverImage.public_id,
        ]);
        unlinkFiles(req);
        throw new ApiError(500, "Something wrong during registering user.");
    }

    res.status(200).json(
        new ApiResponse(200, createdUser, "user creaated successfully.")
    );
});

export { registerUser };
