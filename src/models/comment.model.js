import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, "comment cannot be empty."],
            trim: true,
            validate: {
                validator: function (v) {
                    return v.trim().length > 0;
                },
                message: "comment cannot be empty.",
            },
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required:true
        },
    },
    { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
