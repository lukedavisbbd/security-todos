import { AppError } from 'common';
import { z } from 'zod/v4';

/**
 * @param {unknown} err 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export function errorHandler(err, req, res, next) {
  console.error('┌── errorHandler caught an error:');
  console.error(err);
  console.error('└──────────────────────────────────');

  // 1) Determine numeric status code (fall back to 500)
  const statusCode =
    err instanceof AppError && typeof err.status === 'number'
      ? err.status
      : 500;

  // 2) Build a JSON payload
  const payload = {
    status: statusCode,
    message: err.message || 'Internal Server Error'
  };

  // 3) If err.code exists (custom code), include it
  if (err.code) {
    payload.code = err.code;
  }

  // 4) In non‐prod, attach the stack for debugging
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  // 5) Always send a valid integer status
  res.status(statusCode).json(payload);
}


// /**
//  * @param {unknown} err 
//  * @param {import('express').Request} _req 
//  * @param {import('express').Response} res 
//  * @param {import('express').NextFunction} _next 
//  */
// export const errorHandler = (err, _req, res, _next) => {
//     let appError;
//     if (err instanceof AppError) {
//         appError = err;
//     } else if (err instanceof z.ZodError) {
//         appError = new AppError(err);
//     } else if (err instanceof SyntaxError) {
//         // failed to parse request body as json
//         appError = new AppError({
//             code: 'unprocessable_content',
//             status: 422,
//             message: 'Failed to parse body as JSON.',
//             data: undefined,
//         });
//     } else {
//         // unexpected error
//         console.error(err);
//         appError = new AppError();
//     }
    
//     res.status(appError.response.status).json(appError.response);
// };
