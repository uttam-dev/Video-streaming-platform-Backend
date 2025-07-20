import { mongoose } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params || {};

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "invalid channel id");
    }

    let subscription = await Subscription.aggregate([
        {
            $match: {
                $and: [
                    {
                        subscribers: new mongoose.Types.ObjectId(req.user._id),
                    },
                    {
                        channel: new mongoose.Types.ObjectId(channelId),
                    },
                ],
            },
        },
    ]);

    console.log("aggre", subscription);

    if (subscription.length > 0) {
        subscription = await Subscription.findByIdAndDelete(
            subscription[0]._id,
            { new: true }
        );
        console.log("deleted", subscription);
    } else {
        subscription = await Subscription.create([
            {
                subscribers: req.user?._id,
                channel: channelId,
            },
        ]);

        console.log("created", subscription);
    }

    if (!subscription) {
        throw new ApiError(500, "faild to toggle subscription");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscription, "action toggle successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params || {};

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "invalid channel id");
    }

    const subscribers = await Subscription.find({ channel: channelId });

    return res.status(200).json(new ApiResponse({
        
    }))
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
