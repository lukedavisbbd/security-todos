import { AppError } from 'common';
import z from 'zod/v4';

/**
 * @template {import('zod/v4/core').$ZodType} T
 * @param {T} schema
 * @param {unknown} data
 */
export const validate = (schema, data) => {
    try {
        return z.parse(schema, data);
    } catch (err) {
        if (err instanceof z.ZodError) {
            throw new AppError({
                code: 'validation_error',
                status: 400,
                message: 'Validation Error',
                data: z.treeifyError(err),
            });
        }
        throw err;
    }
};
