import path from "path";

function isVideoFile(file) {
    const allowedMimeTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
    ];
    const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv"];

    const mimetype = file.mimetype;
    const ext = path.extname(file.originalname).toLowerCase();

    return (
        allowedMimeTypes.includes(mimetype) && allowedExtensions.includes(ext)
    );
}


function isImageFile(file) {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
    ];

    const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
        ".svg",
    ];

    const mimetype = file.mimetype;
    const ext = path.extname(file.originalname).toLowerCase();

    return (
        allowedMimeTypes.includes(mimetype) && allowedExtensions.includes(ext)
    );
}

export { isVideoFile, isImageFile };
