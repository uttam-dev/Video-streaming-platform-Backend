import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,
            required: [true, "video file is required!"],
        },
        video_public_id: {
            type: String,
            required: [true, "video file public id is required!"],
        },
        thumbnail: {
            type: String,
            required: [true, "thumbnail is required!"],
        },
        thumbnail_public_id: {
            type: String,
            required: [true, "thumbnail file public id is required!"],
        },
        title: {
            type: String,
            required: [true, "title is required!"],
        },
        description: {
            type: String,
            required: [true, "description is required!"],
        },
        duration: {
            type: Number,
            required: [true, "duration is required!"],
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: [true, "owner id must required"],
        },
    },
    { timestamps: true }
);

mongoose.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
