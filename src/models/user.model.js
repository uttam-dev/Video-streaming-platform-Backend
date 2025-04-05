import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            lowecase: true,
            unique: true,
            required: [true, "username is required!"],
            trim: true,
            index: true,
        },
        email: {
            type: String,
            lowecase: true,
            unique: true,
            required: [true, "email is required!"],
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, "fullname is required!"],
            trim: true,
            index: true,
        },
        avatar: {
            type: String,
            required: [true, "avatar is required!"],
        },
        coverImage: {
            type: String,
        },
        watchHistory: {
            type: Schema.Types.ObjectId,
            ref: "video",
        },
        password: {
            type: String,
            required: [true, "password is require!"],
        },
    },
    { timestamps: true }
);

Schema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = bcrypt.hash(this.password, 10);
    }
    next();
});

Schema.methods.isPasswordCorrect = async function (plainString) {
    return await bcrypt.compare(plainString, this.password);
};

Schema.methods.genrateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

Schema.methods.genrateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);
