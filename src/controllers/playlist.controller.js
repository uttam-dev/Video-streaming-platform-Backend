import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playllist.model.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description = "" } = req.body || {};

    if (!name) {
        throw new ApiError(400, "name must be required.");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });

    if (!playlist) {
        throw new ApiError(500, "error during creating playlist");
    }

    const plainObjPlaylistData = playlist.toObject();

    plainObjPlaylistData.totalVideos = playlist.video?.length || 0;

    res.status(200).json(
        new ApiResponse(
            200,
            plainObjPlaylistData,
            "playlist created successfully"
        )
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(200, "invalid user");
    }

    const playlist = await Playlist.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { $addFields: { totalVideos: { $size: "$video" } } },
    ]);

    res.status(200).json(
        new ApiResponse(200, playlist, "user all playlist fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params || {};

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(200, "invalid playlist");
    }

    const playlist = await Playlist.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
        { $addFields: { totalVideos: { $size: "$video" } } },
    ]);

    if (playlist.length <= 0) {
        throw new ApiError(400, "playlist does not exist");
    }
    res.status(200).json(new ApiResponse(200, playlist));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params || {};

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "invalid playlist");
    }

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid video");
    }

    let playlist;
    try {
        playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $addToSet: { video: new mongoose.Types.ObjectId(videoId) },
            },
            { new: true }
        );
    } catch (error) {
        throw new ApiError(400, error.message);
    }

    if (!playlist) {
        throw new ApiError(500, "error occure during add video on playlist");
    }

    let plainObjPlaylistData = playlist.toObject();

    plainObjPlaylistData.totalVideos = playlist.video?.length;

    res.status(200).json(
        new ApiResponse(200, plainObjPlaylistData, "videos added on playlist")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params || {};

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "invalid playlist");
    }

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid video");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { video: new mongoose.Types.ObjectId(videoId) },
        },
        { new: true }
    );

    const plainObjPlaylistData = playlist.toObject();

    plainObjPlaylistData.totalVideos = playlist.video?.length || 0;
    if (!playlist) {
        throw new ApiError(500, "error during remove video from playlist");
    }

    res.status(200).json(
        new ApiResponse(200, plainObjPlaylistData, "video remove successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params || {};

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "invlid playlist");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if (!playlist) {
        throw new ApiError(400, "invalid playlist");
    }

    res.status(200).json(
        new ApiResponse(200, playlist, "playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params || {};
    const { name = "", description = "" } = req.body || {};

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "invalid playlist");
    }

    if (!name || !name.trim()) {
        throw new ApiError(400, "name should not be emapty");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name, description },
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(500, "error occure during updation");
    }

    res.status(200).json(
        new ApiResponse(200, playlist, "playlist update successfully")
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
