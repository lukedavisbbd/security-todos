import { z } from 'zod/v4';

/**
 * @type {ErrorResponse}
 */
export const unexpectedErrorResponse = {
    code: 'internal_server_error',
    status: 500,
    message: 'An unexpected error has occurred.',
    data: undefined,
};

/**
 * @typedef {(
 *     'internal_server_error' |
 *     'validation_error' |
 *     'bad_request' |
 *     'not_found' |
 *     'unprocessable_content' |
 *     'not_logged_in' |
 *     'missing_role'
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
            super(unexpectedErrorResponse.message);
            this.response = unexpectedErrorResponse;
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
 *     ErrorResponseType<'missing_role', 403>
 * )} ErrorResponse
 */
