import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { mongoose, isValidObjectId } from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params || {};

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video");
    }

    const like = await Like.aggregate([
        {
            $match: {
                $and: [
                    {
                        video: new mongoose.Types.ObjectId(videoId),
                    },
                    {
                        owner: new mongoose.Types.ObjectId(req.user?._id),
                    },
                ],
            },
        },
    ]);

    if (like.length > 0) {
        const deletedLike = await Like.findByIdAndDelete(like[0]._id);
        if (deletedLike) {
            const deletedLikeObj = deletedLike.toObject();
            deletedLikeObj.currentLikeStatus = false;
            return res
                .status(200)
                .json(
                    new ApiResponse(200, deletedLikeObj, "unlike successfully")
                );
        } else {
            throw new ApiError(500, "failed to perform action");
        }
    } else {
        const createdLike = await Like.create({
            video: videoId,
            owner: req.user?._id,
        });

        if (createdLike) {
            const createdLikeObj = createdLike.toObject();
            createdLikeObj.currentLikeStatus = true;
            return res
                .status(200)
                .json(
                    new ApiResponse(200, createdLikeObj, "like successfully")
                );
        } else {
            throw new ApiError(500, "failed to perform action");
        }
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params || {};

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid like");
    }

    const like = await Like.aggregate([
        {
            $match: {
                $and: [
                    {
                        comment: new mongoose.Types.ObjectId(commentId),
                    },
                    {
                        owner: new mongoose.Types.ObjectId(req.user?._id),
                    },
                ],
            },
        },
    ]);

    if (like.length > 0) {
        const deletedLike = await Like.findByIdAndDelete(like[0]._id);
        if (deletedLike) {
            const deletedLikeObj = deletedLike.toObject();
            deletedLikeObj.currentLikeStatus = false;
            return res
                .status(200)
                .json(
                    new ApiResponse(200, deletedLikeObj, "unlike successfully")
                );
        } else {
            throw new ApiError(500, "failed to perform action");
        }
    } else {
        const createdLike = await Like.create({
            comment: videoId,
            owner: req.user?._id,
        });

        if (createdLike) {
            const createdLikeObj = createdLike.toObject();
            createdLikeObj.currentLikeStatus = true;
            return res
                .status(200)
                .json(
                    new ApiResponse(200, createdLikeObj, "like successfully")
                );
        } else {
            throw new ApiError(500, "failed to perform action");
        }
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params || {};

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid tweet");
    }

    const like = await Like.aggregate([
        {
            $match: {
                $and: [
                    {
                        tweet: new mongoose.Types.ObjectId(tweetId),
                    },
                    {
                        owner: new mongoose.Types.ObjectId(req.user?._id),
                    },
                ],
            },
        },
    ]);

    if (like.length > 0) {
        const deletedLike = await Like.findByIdAndDelete(like[0]._id);
        if (deletedLike) {
            const deletedLikeObj = deletedLike.toObject();
            deletedLikeObj.currentLikeStatus = false;
            return res
                .status(200)
                .json(
                    new ApiResponse(200, deletedLikeObj, "unlike successfully")
                );
        } else {
            throw new ApiError(500, "failed to perform action");
        }
    } else {
        const createdLike = await Like.create({
            tweet: tweetId,
            owner: req.user?._id,
        });

        if (createdLike) {
            const createdLikeObj = createdLike.toObject();
            createdLikeObj.currentLikeStatus = true;
            return res
                .status(200)
                .json(
                    new ApiResponse(200, createdLikeObj, "like successfully")
                );
        } else {
            throw new ApiError(500, "failed to perform action");
        }
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                $and: [
                    { owner: new mongoose.Types.ObjectId(req.user?._id) },
                    { video: { $exists: true, $ne: null, $ne: "" } },
                ],
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    { $match: { isPublished: true } },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            isPublished: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$video" },
    ]);

    res.json(likedVideos);
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
