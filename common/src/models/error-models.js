import { z } from 'zod/v4';

/**
 * @type {ErrorResponse}
 */
export const UNEXPECTED_ERROR_RESPONSE = {
    code: 'internal_server_error',
    status: 500,
    message: 'An unexpected error has occurred.',
    data: undefined,
};

/**
 * @param {string} period
 * @returns {ErrorResponse}
 */
export const rateLimitResponse = (period = 'later') => {
    return {
        code: 'rate_limited',
        status: 429,
        message: `Too many requests, please wait and try again ${period}.`,
        data: undefined,
    };
};

/**
 * @typedef {(
 *     'internal_server_error' |
 *     'validation_error' |
 *     'bad_request' |
 *     'not_found' |
 *     'unprocessable_content' |
 *     'not_logged_in' |
 *     'missing_role' |
 *     'rate_limited'
 * )} ErrorCode
 */

export class AppError extends Error {
    /**
     * @type {ErrorResponse}
     */
    response;

    /**
     * @param {ErrorResponse | undefined} error 
     */
    constructor(error = undefined) {
        if (error) {
            super(error.message);
            this.response = error;
        } else {
            super(UNEXPECTED_ERROR_RESPONSE.message);
            this.response = UNEXPECTED_ERROR_RESPONSE;
        }
    }
}

/**
 * @template {ErrorCode} C
 * @template {number} S
 * @template [Data = undefined]
 * @typedef {{
 *     status: S,
 *     code: C,
 *     message: string,
 *     data: Data,
 * }} ErrorResponseType
 */

/**
 * @typedef {(
 *     ErrorResponseType<'internal_server_error', 500> |
 *     ErrorResponseType<'validation_error', 400, import('zod/v4/core').$ZodErrorTree<any>> |
 *     ErrorResponseType<'bad_request', 400> |
 *     ErrorResponseType<'not_found', 404> |
 *     ErrorResponseType<'unprocessable_content', 422> |
 *     ErrorResponseType<'not_logged_in', 401> |
 *     ErrorResponseType<'missing_role', 401> |
 *     ErrorResponseType<'rate_limited', 429> 
 * )} ErrorResponse
 */
