import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "playlist name is required"],
            trim: true,
            validate: {
                validator: (v) => v.trim().length > 0,
            },
            message: "playlist name is required",
        },
        description: {
            type: String,
        },
        video: [
            {
                type: Schema.Types.ObjectId,
                ref: "Videor",
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
