export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: err.message || "internal server error",
        errors: err.errors,
        stack: undefined,
    });
};
