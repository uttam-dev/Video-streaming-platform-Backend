import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { unlinkFiles } from "../utils/unlinkFiles.js";
import {
    deleteFilesOnCloudanary,
    uploadFileOnCloudanary,
} from "../services/cloudinary.service.js";
import { Video } from "../models/video.model.js";
import { isVideoFile, isImageFile } from "../utils/fileFormates.js";
import path from "path";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    

});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body || {};

    // title and description validation
    if (!title || !description) {
        unlinkFiles(req);
        throw new ApiError(400, "title or descripton cannot be empty");
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path || null;

    // video file exist validaton
    if (!videoFileLocalPath) {
        unlinkFiles(req);
        throw new ApiError(400, "video file is required");
    }

    // video file formate validation
    if (!isVideoFile(req.files.videoFile[0])) {
        throw new ApiError(400, "invalid video file formate");
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path || null;

    // thumbnail exist validaton
    if (!thumbnailLocalPath) {
        unlinkFiles(req);
        throw new ApiError(400, "thumbnail is required");
    }

    // video file formate validation
    if (!isImageFile(req.files.thumbnail[0])) {
        throw new ApiError(400, "invalid thumbnail file formate");
    }

    // upload video on cloudinary
    const videoFileCloudinary = await uploadFileOnCloudanary(
        videoFileLocalPath,
        `user/${req.user?._id}/videos`
    );

    // upload video on cloudinary validaton
    if (!videoFileCloudinary?.url) {
        unlinkFiles(req);
        throw new ApiError(500, "error occure during uplodad video file.");
    }

    // upload thumbnail on cloudinary
    const thumbnailCloudinary = await uploadFileOnCloudanary(
        thumbnailLocalPath,
        `user/${req.user?._id}/thumbnails`
    ).catch((error) => {
        console.log(error);
    });

    // upload thumbnail on cloudinary validaton
    if (!thumbnailCloudinary?.url) {
        unlinkFiles(req);
        throw new ApiError(500, "error occure during uplodad thumbnail file.");
    }

    const video_public_id = videoFileCloudinary.public_id;
    const thumbnail_public_id = thumbnailCloudinary.public_id;

    let video;

    try {
        video = await Video.create({
            videoFile: videoFileCloudinary.url,
            video_public_id,
            thumbnail: thumbnailCloudinary.url,
            thumbnail_public_id,
            title,
            description,
            duration: videoFileCloudinary.duration,
            owner: req.user._id,
        });
    } catch (error) {
        deleteFilesOnCloudanary([videoFileCloudinary.public_id], "video");
        deleteFilesOnCloudanary([thumbnailCloudinary.public_id]);
        console.log(error);
    }

    if (!video) {
        deleteFilesOnCloudanary([videoFileCloudinary.public_id], "video");
        deleteFilesOnCloudanary([thumbnailCloudinary.public_id]);
        throw new ApiError(500, "error occure when storing data on database");
    }
    unlinkFiles(req);

    res.status(200).json(
        new ApiResponse(200, video, "video uploded successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params || {};

    if (!videoId) {
        throw new ApiError(400, "video id not provided!");
    }

    let video;

    try {
        video = await Video.findById(videoId);
    } catch (error) {
        throw new ApiError(400, "invalid video id");
    }

    if (!video) {
        throw new ApiError(400, "invalid video id");
    }

    res.status(200).json(
        new ApiResponse(200, video, "video fetched successfully")
    );
});

const updateVideo = asyncHandler(async (req, res,next) => {
    const { videoId } = req.params || {};
    console.log(req.body);

    const { title, description } = req.body || {};

    if (!title || !description) {
        throw new ApiError(400, "title and description are requried");
    }

    if (!videoId) {
        throw new ApiError(400, "video id is missing");
    }

    let video;
    try {
        video = await Video.findByIdAndUpdate(
            videoId,
            {
                title,
                description,
            },
            { new: true }
        );
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "error during update on database");
    }

    res.status(200).json(
        new ApiResponse(200, video, "data update successfully")
    );
});

const updateThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params || {};

    const  thumbnail  = req.file || {};
    
    if (!videoId) {
        unlinkFiles(req)
        throw new ApiError(400, "video id not found");
    }
    
    if (!thumbnail) {
        unlinkFiles(req)
        throw new ApiError(400, "new thumbnail is required");
    }
    
    if (!isImageFile(thumbnail)) {
        unlinkFiles(req)
        throw new ApiError(400, "invalid thumbnail extension");
    }
    const video = await Video.findById(videoId);
    
    if (!video) {
        unlinkFiles(req)
        throw new ApiError(400, "invalid video id");
    }
    
    const oldThumbnail_public_id = video.thumbnail_public_id;
    
    const newThumbnail = await uploadFileOnCloudanary(thumbnail.path,`user/${req.user._id}/thumbnails`);
    
    console.log(newThumbnail);
    
    if(!newThumbnail?.url){
        unlinkFiles(req)
        throw new ApiError(500,"error occure during upload thumnnail")
    }

    video.thumbnail = newThumbnail.url;
    video.thumbnail_public_id = newThumbnail.public_id;
    video.save();
    
    await deleteFilesOnCloudanary(oldThumbnail_public_id);
    
    unlinkFiles(req)
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video.thumbnail,
            "thumbnail updated successfully"
        )
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params || {};

    if (!videoId) {
        throw new ApiError(400, "video id required");
    }

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
        throw new ApiError(500, "invalid video id");
    }

    const video_public_id = video.video_public_id;
    const thumbnail_public_id = video.thumbnail_public_id;

    const videoFileDelete = await deleteFilesOnCloudanary(
        [video_public_id],
        "video"
    );

    if (!videoFileDelete) {
        throw new ApiError(500, "video not deleted on cloudinary!");
    }
    const thumbnailDelete = await deleteFilesOnCloudanary([
        thumbnail_public_id,
    ]);
    if (!thumbnailDelete) {
        throw new ApiError(500, "thumbnail not deleted on cloudinary!");
    }

    res.status(200).json(
        new ApiResponse(200, video, "video delete successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params || {};

    if (!videoId) {
        throw new ApiError(400, "video id must required");
    }

    const video = await Video.findById(videoId);

    video.isPublished = !video.isPublished;

    video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: video.isPublished },
                "status updated successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    updateThumbnail,
    deleteVideo,
    togglePublishStatus,
};
