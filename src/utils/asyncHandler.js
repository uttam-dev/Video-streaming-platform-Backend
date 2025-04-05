const asyncHandler = (fn) => async (req, res, next) => {
    Promise.resolve(await fn(req, res, next)).catch((err) => next(err));
};
