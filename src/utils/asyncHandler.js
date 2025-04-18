const asyncHandler = (fn) => async (req, res, next) => {
    return Promise.resolve(await fn(req, res, next)).catch((err) => next(err));
};

export { asyncHandler };
