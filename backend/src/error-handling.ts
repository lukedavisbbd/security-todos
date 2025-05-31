import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    status?: number;
}

export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error(err);
    res.status(err.status || 500).json({
        // only show error message if status set,
        // otherwise might contain sensitive information
        message: (err.status ? err.message : false) || 'Internal Server Error',
    });
};
