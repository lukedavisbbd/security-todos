import { AppError } from 'common';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';

export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    let appError;
    if (err instanceof AppError) {
        appError = err;
    } else if (err instanceof z.ZodError) {
        appError = new AppError(err);
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
