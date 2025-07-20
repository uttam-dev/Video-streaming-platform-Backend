import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (v) => v.trim().length > 0,
                message: "content cannot  be empty.",
            },
        },
        image: {
            type: String,
            trim: true,
        },
        image_public_id:{
            type: String,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Tweet = mongoose.model("Tweet", tweetSchema);
