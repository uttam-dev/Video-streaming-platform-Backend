import multer from "multer";

const storage = multer.diskStorage({
    destination: function (res, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const prefix = Math.round(Math.random() * 16);
        cb(null, prefix + "-" + file.filename);
    },
});

export const upload = multer({ storage });
