import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params || {};
    const { page = 1, limit = 10 } = req.query || {};

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid video");
    }

    try {
        const comment = await Comment.aggregate([
            { $match: { video: new mongoose.Types.ObjectId(videoId) } },
            {
                $skip: parseFloat((page - 1) * limit),
            },
            {
                $limit: parseInt(limit),
            },
        ]);

        if (!comment || comment.length <= 0) {
            throw new ApiError(500, "error occure during comments fetching.");
        }

        console.log(comment);

        res.status(200).json(
            new ApiResponse(200, {comments:comment,totalComments:comment.length}, "comment fetched successfully.")
        );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const addComment = asyncHandler(async (req, res) => {
    const { content = "" } = req.body || {};
    const { videoId } = req.params || {};

    if (!content || !content.trim()) {
        throw new ApiError(400, "comment cannot be empty.");
    }

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid video");
    }

    try {
        const video = await Video.findById(videoId);

        if (!video || video.length <= 0) {
            throw new ApiError(400, "invalid video");
        }

        const comment = await Comment.create({
            content,
            video: videoId,
            owner: req.user?._id,
        });

        if (!comment) {
            throw new ApiError(500, "error occure during creating comment");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "comment created successfully.")
            );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const updateComment = asyncHandler(async (req, res) => {
    const { content = "" } = req.body || {};
    const { commentId } = req.params || {};

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "invalid comment");
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "comment not be empty");
    }

    try {
        const comment = await Comment.findByIdAndUpdate(
            commentId,
            {
                content,
            },
            { new: true }
        );

        console.log(comment);

        if (!comment) {
            throw new ApiError(500, "error occure during updation");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "comment updated successfully")
            );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params || {};

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "invalid comment");
    }

    try {
        const comment = await Comment.findByIdAndDelete(commentId);

        if (!comment) {
            throw new ApiError(500, "error occure during updation");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "comment deleted successfully")
            );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

export { getVideoComments, addComment, updateComment, deleteComment };
