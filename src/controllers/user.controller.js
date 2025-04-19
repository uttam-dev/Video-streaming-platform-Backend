import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
    deleteFilesOnCloudanary,
    uploadFileOnCloudanary,
} from "../services/cloudinary.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import { unlinkFiles } from "../utils/unlinkFiles.js";
import { COOKIE_OPTIONS } from "../constants.js";
import JWT from "jsonwebtoken";

const genrateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = await user.genrateAccessToken();
        const refreshToken = await user.genrateRefreshToken();

        user.refreshToken = refreshToken;
        user.save();

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "something went wrong during gerating access token and refresh token"
        );
    }
};
const registerUser = asyncHandler(async (req, res) => {
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

    next();
});

const loginUser = asyncHandler(async (req, res, next) => {
    // get all fields data
    const { username, email, password } = req.body;

    if ((!username || !email) && !password) {
        throw new ApiError(400, "all fields are required.");
    }

    // verify email or username

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
        throw new ApiError(400, "user does not exist");
    }

    // verify password
    if (!(await user.isPasswordCorrect(password))) {
        throw new ApiError(400, "invalid user credentials.");
    }

    // genrate refresh and access token

    const { refreshToken, accessToken } =
        await genrateAccessTokenAndRefreshToken(user._id);

    let userObj = user.toObject();

    delete userObj.password;
    delete userObj.refreshToken;
    delete userObj.watchHistory;

    // set cookie for refresh token and access token

    res.status(200)
        .cookie("accessToken", accessToken, COOKIE_OPTIONS)
        .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
        .json(
            new ApiResponse(
                200,
                { user: userObj, refreshToken, accessToken },
                "user logged in successfully."
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );

    res.status(200)
        .clearCookie("accessToken", COOKIE_OPTIONS)
        .clearCookie("refreshToken", COOKIE_OPTIONS)
        .json(new ApiResponse(200, null, "user loggedout."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // GENRATE ACCESS TOKEN BASED ON REFRESH TOKEN
    const token =
        req.cookies?.refreshToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(402, "unauthorized request");
    }

    let decodedToken;

    try {
        decodedToken = JWT.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "token expired.", error);
    }

    if (!decodedToken) {
        throw new ApiError(402, "invalid refresh token");
    }

    const user = await User.findById(decodedToken?._id);

    if (!user) {
        throw new ApiError(401, "invalid refresh token");
    }

    if (token !== user.refreshToken) {
        throw new ApiError(401, "invalid refresh token");
    }

    const { refreshToken, accessToken } =
        await genrateAccessTokenAndRefreshToken(decodedToken._id);

    res.status(200)
        .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
        .cookie("accessToken", accessToken, COOKIE_OPTIONS)
        .json(
            new ApiResponse(
                200,
                { refreshToken, accessToken },
                "access and refresh token genrated successfully."
            )
        );
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
