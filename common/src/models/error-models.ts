import { z } from 'zod/v4';
import { $ZodErrorTree } from 'zod/v4/core';

export const unexpectedErrorResponse: ErrorResponse = {
    code: 'internal_server_error',
    status: 500,
    message: 'An unexpected error has occurred.',
    data: undefined,
};

export type ErrorCode =
    'internal_server_error' |
    'validation_error' |
    'bad_request' |
    'not_found' |
    'unprocessable_content' |
    'not_logged_in' |
    'missing_role';

export class AppError extends Error {
    response: ErrorResponse;

    constructor(error?: ErrorResponse | z.ZodError) {
        if (error instanceof z.ZodError) {
            const message = z.prettifyError(error);
            super(message);
            
            this.response = {
                code: 'validation_error',
                status: 400,
                message,
                data: z.treeifyError(error),
            };
        } else if (error) {
            super(error.message);
            
            this.response = error;
        } else {
            super(unexpectedErrorResponse.message);
            
            this.response = unexpectedErrorResponse;
        }
    }
}

export type ErrorResponseType<C extends ErrorCode, S extends number, Data = undefined> = {
    status: S,
    code: C,
    message: string,
    data: Data,
}

export type ErrorResponse =
    ErrorResponseType<'internal_server_error', 500> |
    ErrorResponseType<'validation_error', 400, $ZodErrorTree<unknown>> |
    ErrorResponseType<'bad_request', 400> |
    ErrorResponseType<'not_found', 404> |
    ErrorResponseType<'unprocessable_content', 422> |
    ErrorResponseType<'not_logged_in', 401> |
    ErrorResponseType<'missing_role', 403>;
