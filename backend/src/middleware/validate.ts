import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Express middleware to validate request body against a Zod schema.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        );
        _res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: messages,
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        );
        _res.status(400).json({
          success: false,
          message: "Invalid query parameters",
          errors: messages,
        });
        return;
      }
      next(error);
    }
  };
}
