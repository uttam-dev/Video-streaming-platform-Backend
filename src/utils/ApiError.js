class ApiError extends Error {
    constructor(statusCode, messaage, errors = [], stack = "") {
        super(messaage);
        this.statusCode = statusCode;
        this.message = messaage;
        this.errors = errors;
        this.success = false;
        this.data = null;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this.this.constructor);
        }
    }
}

export { ApiError };
