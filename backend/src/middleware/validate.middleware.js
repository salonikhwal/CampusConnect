import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        status: 'error',
        message: formattedErrors[0]?.message || 'Input validation failed',
        errors: formattedErrors,
      });
    }
    return res.status(400).json({
      status: 'error',
      message: 'Invalid request payload',
    });
  }
};
