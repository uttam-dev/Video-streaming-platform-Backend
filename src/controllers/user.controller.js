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
import path from "path";
import mongoose from "mongoose";

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
const registerUser = asyncHandler(async (req, res,next) => {
    const { username, fullName, email, password } = req.body || {};

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
    const avatar = await uploadFileOnCloudanary(avatarLocalPath, "avatar");
    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadFileOnCloudanary(
            coverImageLocalPath,
            "coverImage"
        );
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
        { $unset: { refreshToken: 1 } },
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

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid old password");
    }

    user.password = newPassword;

    user.save({ validateBeforeSave: false });

    res.status(200).json(
        new ApiResponse(200, {}, "password change successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    console.log(req.user);
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "current user fetched successfully")
        );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "fullName or email required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "account details updated successfully")
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing");
    }

    const user = await User.findById(req.user?._id).select(
        "-password -refreshToken"
    );

    const oldAvatarCloudeneryPath = user.avatar;

    const publicId = path.parse(oldAvatarCloudeneryPath).name;

    const avatar = await uploadFileOnCloudanary(avatarLocalPath, "avatar");

    if (!avatar?.url) {
        throw new ApiError(500, "error occure while uploding avtar");
    }

    user.avatar = avatar.url;
    user.save();

    await deleteFilesOnCloudanary([publicId]);

    res.status(200).json(
        new ApiResponse(200, user, "avatar updated successfully")
    );
    req.next();
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file is missing");
    }

    const user = await User.findById(req.user?._id).select(
        "-password -refreshToken"
    );

    const oldCoverImageCloudeneryPath = user.coverImage;

    const publicId = path.parse(oldCoverImageCloudeneryPath).name;

    const coverImage = await uploadFileOnCloudanary(
        coverImageLocalPath,
        "coverImage"
    );

    if (!coverImage?.url) {
        throw new ApiError(500, "error occure while uploding avtar");
    }

    user.coverImage = coverImage.url;
    user.save();

    await deleteFilesOnCloudanary([publicId]);

    res.status(200).json(
        new ApiResponse(200, user, "cover Image updated successfully")
    );
    req.next();
});

const getUserChennelProfile = asyncHandler(async (req, res) => {
    const username = req.params;

    if (!username?.trim()) {
        throw new ApiError(404, "username are missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscribers",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelSubscribeToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscribers"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelSubscribeToCount: 1,
                isSubscribed: 1,
            },
        },
    ]);

    if (!channel.length) {
        throw new ApiError(404, "channel does not exist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "user channel fetched successfully"
            )
        );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        avatar: 1,
                                        username: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, user[0], "watch history fetched successfully")
        );
});
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChennelProfile,
};
