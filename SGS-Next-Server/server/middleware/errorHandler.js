const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode <= 200 ? 500 : res.statusCode;

    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        err.message = "File size exceeds 2 MB limit! Please choose a smaller image.";
    } else if (err.message && err.message.includes("Invalid file type")) {
        statusCode = 400;
    }

    res.status(statusCode);

    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

export default errorHandler;
