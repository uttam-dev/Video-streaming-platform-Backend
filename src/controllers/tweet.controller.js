import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoose } from "mongoose";
import {
    uploadFileOnCloudanary,
    deleteFilesOnCloudanary,
} from "../services/cloudinary.service.js";
import { unlinkFiles } from "../utils/unlinkFiles.js";
import { isImageFile } from "../utils/fileFormates.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body || {};
    let image = req.file || "";

    if (!content) {
        unlinkFiles(req);
        throw new ApiError(400, "content is required");
    }

    if (image && !isImageFile(image)) {
        unlinkFiles(req);
        throw new ApiError(400, "invalid image formate");
    }

    let imageOnCludinary = "";
    let image_public_id = "";
    if (image) {
        try {
            imageOnCludinary = await uploadFileOnCloudanary(
                image.path,
                `user/${req.user._id}/tweet`
            );
        } catch (error) {
            unlinkFiles(req);
            throw new ApiError(500, "error occure when uploding image");
        }
    }

    console.log(imageOnCludinary);

    if (imageOnCludinary) {
        image = imageOnCludinary.url;
        image_public_id = imageOnCludinary.public_id;
    }

    let tweet;
    try {
        tweet = await Tweet.create({
            content,
            image,
            image_public_id,
            owner: req.user?._id,
        });
    } catch (error) {
        unlinkFiles(req);
        throw new ApiError(500, error.message);
    }

    if (!tweet) {
        unlinkFiles(req);
        if (image_public_id) {
            await deleteFilesOnCloudanary([image_public_id]);
        }
        throw new ApiError(500, "error occure during create tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const tweet = await Tweet.aggregate([
        {
            $match: { owner: req.user._id },
        },
        {
            $lookup: {
                from: "user",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params || {};
    const { content } = req.body || {};

    if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "invalid tweet id");
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "content must provided");
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content,
        },
        { new: true }
    );

    if (!tweet) {
        throw new ApiError(500, "error occure during update");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params || {};

    if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "invalid tweet id");
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if (!tweet) {
        throw new ApiError(500, "error occure during deletation");
    }

    if (tweet.image_public_id) {
        await deleteFilesOnCloudanary([tweet.image_public_id]);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
