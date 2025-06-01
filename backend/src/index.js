import express from 'express';
import config from './config/config.js';
import apiRoutes from './routes/api-routes.js';
import { errorHandler } from './middleware/error-middleware.js';
import cookieParser from 'cookie-parser';
import { AppError } from 'common';

/**
 * @typedef {(import('express').Request & {
 *     jwtContents: import('common').JwtContents & ({ iat: number, exp: number } | {})
 * })} AuthenticatedRequest
 */

const app = express();

app.use(cookieParser())
app.use(express.json());

app.use('/api/', apiRoutes);

app.use('*path', (_res, _req) => {
    throw new AppError({
        code: 'not_found',
        status: 404,
        message: 'Route not found.',
        data: undefined,
    });
});

app.use(errorHandler);

app.listen(config.port, (error) => {
    if (error) {
        console.error(`Failed to start server: ${error.message}`);
    } else {
        console.log(`Server running on port ${config.port}`);
    }
});
