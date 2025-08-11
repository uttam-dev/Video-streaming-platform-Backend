import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers,
    //  total videos, total likes etc.

    try {
        const [videosStats, totalLikes, totalSubscribers] = await Promise.all([
            Video.aggregate([
                {
                    $match: {
                        owner: new mongoose.Types.ObjectId(req.user._id),
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalVideos: { $sum: 1 },
                        totalViews: { $sum: "$views" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalVideos: 1,
                        totalViews: 1,
                    },
                },
            ]),

            Like.aggregate([
                {
                    $match: {
                        $and: [
                            {
                                owner: new mongoose.Types.ObjectId(
                                    req.user._id
                                ),
                            },
                            { video: { $exists: true, $ne: null, $ne: "" } },
                        ],
                    },
                },
                {
                    $count: "totalLikes",
                },
            ]),

            Subscription.countDocuments({
                channel: req.user._id,
            }),
        ]);
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    ...videosStats[0],
                    ...(totalLikes[0] || { totalLikes: 0 }),
                    totalSubscribers: totalSubscribers || 0,
                },
                "data fatched successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        const videos = await Video.find({ owner: req.user._id }).lean();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { totalVideos: videos.length, videos },
                    "videos fetched successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

export { getChannelStats, getChannelVideos };
