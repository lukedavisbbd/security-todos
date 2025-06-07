import { AppError } from 'common';
import { z } from 'common';

/**
 * @param {unknown} err 
 * @param {import('express').Request} _req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} _next 
 */
export const errorHandler = (err, _req, res, _next) => {
    let appError;
    if (err instanceof AppError) {
        appError = err;
    } else if (err instanceof z.ZodError) {
        appError = new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation failed for one or more fields.',
            data: { errors: err.issues.map(issue => issue.message) },
        });
    } else if (err instanceof SyntaxError) {
        // failed to parse request body as json
        appError = new AppError({
            code: 'unprocessable_content',
            status: 422,
            message: 'Failed to parse body as JSON.',
            data: undefined,
        });
    } else {
        // unexpected error
        console.error(err);
        appError = new AppError();
    }
    
    res.status(appError.response.status).json(appError.response);
};