import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "unauthorized request");
    }

    let decodedToken;

    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "token expired.", error);
    }

    let user;
    
    try {
        user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
    } catch (error) {
        throw new ApiError(401, "invalid access token");
    }

    if (!user) {
        throw new ApiError(401, error?.message || "invalid access token");
    }

    req.user = user;

    next();
});

export { verifyJWT };
