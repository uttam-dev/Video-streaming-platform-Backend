import mongoose, { model, Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscribers: {
            type: Schema.Types.ObjectId,//who subscribed user
            ref: "User",
        },
        channel: {
            type: Schema.Types.ObjectId,//user subscribed others
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
