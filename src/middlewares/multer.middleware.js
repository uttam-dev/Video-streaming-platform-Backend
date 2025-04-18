import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        const prefix = Math.round(Math.random() * 90000);
        cb(null, prefix + "-" + file.originalname);
    },
});

export const upload = multer({ storage });
